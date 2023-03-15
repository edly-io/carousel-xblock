"""edly_carousel an xblock for making custom carousel for multi type content"""

import logging
from json import JSONEncoder
from datetime import datetime

from webob import Response
from django.apps import apps
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.scorable import ScorableXBlockMixin, Score
from xblock.fields import Scope, String, Dict, Float, List

from opaque_keys.edx.keys import CourseKey

from edly_carousel.schema import CAROUSEL_SCHEMA
from edly_carousel.utils import (render_template, resource_string, FEEDBACK_HTML,
                                 add_incomplete_progress_feedback_html)


log = logging.getLogger(__name__)    # pylint: disable=abstract-method

LAYOUTS = ['moderate', 'narrow']


class EdlyCarouselXBlock(XBlock, ScorableXBlockMixin):
    """
    This xblock makes a multi media carousel, each page can contain mixture of audio,
    video, images and MCQ/MRQ types
    """

    has_score = True
    icon_class = 'problem'
    display_name = String(help="This name appears in horizontal navigation at the top of the page.",
                          default="Quiz / Exam",
                          scope=Scope.content)
    carousel_options = Dict(help="Editable carousel options", scope=Scope.settings, default={
        'passing_marks': 70, 'max_attempts': 0,
        'is_summative': False, 'layout': 'moderate',
        'marker_passing_score': 'Passing score', 'passing_title': 'Congratulations, you have passed!',
        'progressbar_text': 'Your Score', 'failing_title': 'Sorry, you have failed!',
        'attempts_text': "This is a graded question. You have COUNTER attempts remaining",
        'last_attempt_text': 'You can attempt just once',
        'passing_msg': 'You can proceed on to the next step.', 'link_button_text': 'View Progress',
        'show_link_button': False, 'button_link': "Link Text here", 'incomplete_feedback_title': 'Questions attempted',
        'incomplete_feedback': 'You must complete all assessments to get feedback'})

    start_page = String(help="HTML to appear on first page",
                        default="""
                            <span class="title">Instructions</span><p class="prg">In the following four questions, 
                            you will be presented with different scenarios in the form of audios or videos. 
                            Watch the listen and watch them carefully, and answer the questions that follow.
                            <span>Time required: 3 minutes</span></p><button id="start">Start 
                            <i class="fa fa-angle-right" aria-hidden="true"></i></button>
                            <div class="note"><p><b>Note:&nbsp;</b>questions with the <img src="ICON_URL"/> 
                            icon will be graded questions.</p></div>

                            <style>
                            .carousel .mrq-submit, .carousel .mcq-submit, .carousel-start #start{
                                background: #395B87;
                            }
                            .carousel .mrq-submit:hover, .carousel .mcq-submit:hover , .xblock-student_view-edly_carousel .carousel-start #start:hover{
                                background: #253B58 !important;
                            }
                            </style>

                            """,
                        scope=Scope.content)
    last_page = String(help="HTML that appears on the last page",
                       default="""
                           <span class="title">Summary</span><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                           In purus velit, tincidunt ac nibh quis, sollicitudin varius libero. Nullam at mi felis. 
                           Donec a scelerisque augue, sit amet porttitor nibh. Suspendisse at lorem ut elit placerat 
                           blandit.</p>
                           """, scope=Scope.content)
    slides = List(help="List of slide objects", scope=Scope.content, default=[])
    user_responses = Dict(help="Status assessment attempts", default={}, scope=Scope.user_state)
    weight = Float(display_name="Problem Weight", help="Defines the number of points the problem is worth.",
                   scope=Scope.settings, default=1, enforce_type=True)
    raw_earned = Float(help="Keeps maximum score achieved by student as a raw value between 0 and 1.",
                       scope=Scope.user_state, default=0, enforce_type=True)
    raw_possible = Float(help="Maximum score available of the problem as a raw value between 0 and 1.",
                         scope=Scope.user_state, default=1, enforce_type=True)

    @property
    def _last_page_feedback_for_formattive_carousel(self):
        """Last page HTML for formattaive or survey only Carousel"""

        wrapped_div = """
                     <div class="formattive-feedback">
                        <div class='progress-div'>
                            {}
                        </div>
                     </div>
                      """
        return self.last_page if self.total_assessments <= 0 else wrapped_div.format(self.last_page)

    @property
    def last_slide(self):
        """
        get content of last slide for the carousel
        : return: (str) content of last slide page
        """

        last_slide = FEEDBACK_HTML if self.is_summative else self._last_page_feedback_for_formattive_carousel
        return add_incomplete_progress_feedback_html(last_slide) if self.total_assessments > 0 else last_slide

    @property
    def student_view_js_dict(self):
        """
        student view data
        :return: (dict) dict containing data for student view
        """

        return {
            'passing_msg': self.passing_msg,
            'is_summative': self.is_summative,
            "has_slides": len(self.slides) > 0,
            'passing_marks': self.passing_marks,
            'failing_title': self.failing_title,
            'passing_title': self.passing_title,
            'progress_text': self.progress_text,
            'attempts_text': self.attempts_text,
            'progressbar_text': self.progressbar_text,
            'last_attempt_text': self.last_attempt_text,
            'max_attempts': self.assessment_max_attempts,
            'marker_passing_score': self.marker_passing_score,

            'show_link_button': self.show_link_button,
            'link_button_text': self.link_button_text,
            'link_button_url': self.link_button_url,
            'incomplete_feedback': self.incomplete_feedback,
            'incomplete_feedback_title': self.incomplete_feedback_title,
            'graded_image': self._get_graded_image_path()
        }

    def student_view_context(self):
        """Get student view context."""

        slides = self.slides + [self.last_slide]
        logo_img = self._get_image_path('logo.svg')

        return {
            'self': self,
            'slides': slides,
            'logo_img': logo_img,
            'graded_image': self._get_graded_image_path()
        }

    # Context argument is specified for xblocks, but we are not using herein
    def student_view(self, context=None):  # pylint: disable=unused-argument
        """
        The primary view of the EdlyCarouselXBlock, shown to students
        when viewing courses.
        """

        fragment = Fragment()
        html = render_template("templates/edly_carousel.html", self.student_view_context())
        line = self._get_image_path('line.png')
        fragment.add_content(html)
        fragment.add_javascript(resource_string("public/js/src/edly_carousel.js"))
        fragment.add_javascript_url("https://fast.wistia.com/assets/external/E-v1.js")
        fragment.add_css(render_template("public/css/edly_carousel.css", {"line": line}))
        fragment.initialize_js('EdlyCarouselXBlock', self.student_view_js_dict)
        return fragment

    # Context argument is specified for xblocks, but we are not using herein
    def studio_view(self, context):  # pylint: disable=unused-argument
        """
        Studio edit view
        """

        fragment = Fragment()
        fragment.add_content(render_template('templates/edly_carousel_edit.html', {'self': self,
                                                                                   'layout_options': LAYOUTS}))
        fragment.add_javascript(resource_string("public/js/src/edly_carousel_edit.js"))
        fragment.initialize_js('EdlyCarouselEditBlock')

        return fragment

    def _get_correct_submissions(self):
        """
        get total number of correct submissions by user
        :return: (int)
        """

        correct_submissions = 0
        for value in self.user_responses.values():
            correct_submissions += value.get('grade', 0) if value.get('type', 'survey') == 'summative' else 0
        return correct_submissions

    @property
    def start_page_content(self):
        if 'ICON_URL' in self.start_page:
            return self.start_page.replace('ICON_URL', self._get_graded_image_path())
        return self.start_page

    @property
    def assessment_completed(self):
        """Has user interacted with all assessments"""

        return len(self.user_responses) >= self.total_assessments

    def _submit_carousel_grade(self, data):
        """
        submit user interaction with carousel's result
        :return: (dict)
        """
        # User needs to attempt all assessments
        if self.assessment_completed and self.has_passed:
            data['max_value'] = 1.0
            logging.info("Submitting carousel data: {}".format(data))
            self.runtime.publish(self, "grade", data)
        return {'result': 'success'}

    def _get_image_path(self, image_name):
        """Get path for a static image."""

        return self.runtime.local_resource_url(self, 'public/images/{}'.format(image_name))

    def _get_graded_image_path(self):
        """Return graded image path."""

        return self._get_image_path('graded.svg')

    @property
    def has_passed(self):
        """User has passed the XBlock or not"""

        return self.user_obtained_marks >= (self.passing_marks/100)

    @property
    def user_obtained_marks(self):
        """
        percentage of marks obtained by user
        """

        return self._get_correct_submissions()/self.weight if self.is_summative else 1

    def _get_carousel_option(self, item_key, def_value):
        """
        get option against given key from carousel option dict
        :param item_key: (str) item key
        :param def_value: (any) defalt value

        :return: (value) value against given key, type may vary
        """

        return self.carousel_options.get(item_key, def_value)

    @property
    def is_summative(self):
        """ is summative carousel or not """

        return self._get_carousel_option('is_summative', False)

    @property
    def layout(self):
        """ selected carousel layout """

        return self._get_carousel_option('layout', 'moderate')

    @property
    def passing_marks(self):
        """ passing of the carousel"""

        return self._get_carousel_option('passing_marks', 70)

    @property
    def passing_msg(self):
        """ progress msg of the carousel"""

        return self._get_carousel_option('passing_msg', '')

    @property
    def incomplete_feedback_title(self):
        """ incomplete feedback msg of the carousel"""

        return self.carousel_options.get('incomplete_feedback_title', "Questions attempted")

    @property
    def incomplete_feedback(self):
        """ incomplete feedback msg of the carousel"""

        return self._get_carousel_option('incomplete_feedback',
                                         'You must complete all assessments to get feedback')

    @property
    def progress_text(self):
        """ progress text of the carousel"""

        return self._get_carousel_option('progress_text', '')

    @property
    def failing_title(self):
        """ fail screen title of the carousel"""

        return self._get_carousel_option('failing_title', '')

    @property
    def passing_title(self):
        """ passing screen title of the carousel"""

        return self._get_carousel_option('passing_title', '')

    @property
    def attempts_text(self):
        """ attempts text of the carousel"""

        return self._get_carousel_option('attempts_text', '')

    @property
    def progressbar_text(self):
        """ progressbar text of the carousel"""

        return self._get_carousel_option('progressbar_text', '')

    @property
    def last_attempt_text(self):
        """ last attempt text of the carousel"""

        return self._get_carousel_option('last_attempt_text', '')

    @property
    def total_assessments(self):
        """ total number of assessments authored in carousel """

        return self._get_carousel_option('total_assessments', 0)

    @property
    def show_link_button(self):
        """ total number of assessments authored in carousel """

        return self._get_carousel_option('show_link_button', False)

    @property
    def link_button_text(self):
        """ total number of assessments authored in carousel """

        return self._get_carousel_option('link_button_text', "")

    @property
    def link_button_url(self):
        """ total number of assessments authored in carousel """

        return self._get_carousel_option('link_button_url', "")

    @property
    def marker_passing_score(self):
        """ marker passing score text of the carousel"""

        return self._get_carousel_option('marker_passing_score', '')

    @property
    def assessment_max_attempts(self):
        """ maximum attempts of the carousel"""

        return self._get_carousel_option('max_attempts', 0)

    @property
    def survey_response_model(self):
        """
        Survey response Model
        :returns: (SurveyResponse) SurveyResponseModel
        """

        return apps.get_model('survey_app', 'SurveyResponseModel')

    @staticmethod
    def shorten_string(string, limit):
        """Shorten the given string within given limit"""

        if len(string) > limit:
            log.info("Given string limit is {}, '{}' will be shortened".format(limit, string))
            return string[:limit]
        return string

    def _save_survey_response(self, user_response):
        """
        Save survey response from submitted user response
        """

        if user_response.get('type') == 'survey':
            # Shorten the string if length is > than required limit
            question = self.shorten_string(user_response.pop('question', 'Start day of the Week?'), 128)
            response = self.shorten_string(user_response.get('response', 'Monday'), 512)
            user_id = self.scope_ids.user_id
            course_key = CourseKey.from_string(str(self.course_id))  # pylint: disable=no-member
            log.info("Answer '{}', Question:'{}' CourseKey:'{}'".format(response, question, course_key))
            SurveyResponseModel = self.survey_response_model
            SurveyResponseModel.objects.create(user=user_id, question=question, response=response, course_id=course_key)

    def _submit_summative_grade(self, data):
        """
        submit summative assessment grade
        :return: (dict)
        """

        for key, value in data.items():
            submitted_record = self.user_responses.get(key, {})
            value['attempts_remaining'] = submitted_record.get('attempts_remaining', self.assessment_max_attempts) - 1
            if data.get('type', 'formative') == 'summative' and value['attempts_remaining'] < 0:
                value['attempts_remaining'] = 0
                value['grade'] = 0
            else:
                value['grade'] = submitted_record.get('grade', 0) or value.get('grade', 0)
            self._save_survey_response(value)
            self.user_responses[key] = value
            self.calculate_score()

            progress = self.user_obtained_marks
            self._submit_carousel_grade({'value': progress})
            return value

    @XBlock.handler
    def get_slides(self, request, suffix=''):  # pylint: disable=unused-argument
        """get slides data"""
        return self.json_response(self.slides)

    @property
    def _base_response(self):
        """base response dict"""

        return {'user_progress': self.user_obtained_marks, 'result': 'success',
                'completed_and_passed': self.assessment_completed,
                'interactions': len(self.user_responses), 'total_assessments': self.total_assessments}

    @XBlock.handler
    def get_user_state(self, request, suffix=''):  # pylint: disable=unused-argument
        """
        get user submitted responses
        """

        response = self._base_response
        response.update({'user_response': self.user_responses})
        return self.json_response(response)

    @XBlock.json_handler
    def submit_student_response(self, data, suffix=''):  # pylint: disable=unused-argument
        """
        Publish data for analytics purposes
        """

        logging.info("User submitted response :{}".format(data))

        response = self._submit_carousel_grade(data) if data.get('last_slide', False
                                                                 ) else self._submit_summative_grade(data)
        response.update(self._base_response)
        return self.json_response(response)

    @property
    def maximum_attempts(self):
        """
        max attempts count
        """

        return 0 if self.assessment_max_attempts < 0 else self.assessment_max_attempts

    @staticmethod
    def validate_studio_data(data):
        """ Validate authoring side data """

        if int(data.get('passing_marks', 70)) not in (70, 100):
            return {'result': 'error', 'message': "Passing score should be either 70 or 100"}
        show_link_button = data.get('show_link_button', 'off') == 'on'
        if not data.get('is_summative', False) and show_link_button:
            return {'result': 'error', 'message': "To show link button, add at least one Summative assessment"}
        if show_link_button and not data.get('link_button_url', None):
            return {'result': 'error', 'message': "Enter link button URL"}
        return None

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):  # pylint: disable=unused-argument
        """
        update XBlock via studio authored options
        """

        response = self.validate_studio_data(data)
        if response:
            return response

        self.slides = data.get('slides')
        self.display_name = data.get("title")
        self.carousel_options = CAROUSEL_SCHEMA(data)
        self.weight = data.get('summative_assessments', 1) if self.is_summative else 1
        self.last_page = data.get('last_page')
        self.start_page = data.get('start_page')
        logging.info('Saving carousel data: {} , weight:{}'.format(data, self.weight))

        return {'result': 'success'}

    @staticmethod
    def json_response(payload):
        """
        This function is to convert dictionary to json http response object.
        :param payload: dict
        :return: Response
        """
        class CustomJSONEncoder(JSONEncoder):
            """JSON Encoder Class"""
            def default(self, o):
                if isinstance(o, datetime.date):
                    return dict(year=o.year, month=o.month, day=o.day)
                return o.__dict__
        return Response(CustomJSONEncoder().encode(payload), content_type='application/json', charset='UTF-8')

    #   Necessary overrides from ScorableXBlockMixin
    def get_score(self):
        """
        Return a raw score already persisted on the XBlock.  Should not
        perform new calculations.

        :return: (namedtuple::Score) Return a raw score already persisted on the XBlock.
        """

        return float(self.raw_earned), float(self.max_score())

    def set_score(self, score):
        """
        Persist a score to the XBlock.
        The score is a named tuple with a raw_earned attribute and a
        raw_possible attribute, reflecting the raw earned score and the maximum
        raw score the student could have earned respectively.

            :param score: A namedtuple Score with the new score
            :type score: namedtuple::Score
        """

        self.raw_earned = score.raw_earned

    def calculate_score(self):
        """
        Calculate a new raw score based on the state of the problem.
        This method should not modify the state of the XBlock.

        :return: (namedtuple::Score) Score(raw_earned=float, raw_possible=float)
        """

        correct_submissions = self._get_correct_submissions()
        return Score(float(correct_submissions), float(self.max_score()))

    def allows_rescore(self):  # pylint: disable=no-self-use
        """
        Boolean value: Can this problem be re-scored?
        Subtypes may wish to override this if they need conditional support for
        re-scoring.

        :return: (Boolean) Boolean for allowed re-scores

        """

        return True

    def max_score(self):
        """
        Function which returns the max score for an xBlock which emits a score
        https://openedx.atlassian.net/wiki/spaces/AC/pages/161400730/Open+edX+Runtime+XBlock+API#OpenedXRuntimeXBlockAPI-max_score(self):

        :return: (int) Max Score for this problem
        """

        return self.weight

    def weighted_grade(self):
        """
        Returns the block's current saved grade multiplied by the block's
        weight- the number of points earned by the learner.

        :return: (float) A weighted grade from the current block state
        """

        return self.raw_earned * self.weight

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("EdlyCarouselXBlock",
             """<edly_carousel/>
             """),
            ("Multiple EdlyCarouselXBlock",
             """<vertical_demo>
                <edly_carousel/>
                <edly_carousel/>
                <edly_carousel/>
                </vertical_demo>
             """),
        ]
