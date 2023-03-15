"""Utility methods"""

from xml.etree import ElementTree
from django.template import Context, Template
from pkg_resources import resource_string as pkg_resource_string


def add_incomplete_progress_feedback_html(source_html):
    """
    Add Feedback HTML in given source HTML string
    :param source_html: (str) HTML in string format

    :return: (str) sting
    """

    source_tree = ElementTree.fromstring(source_html)
    feedback_tree = ElementTree.fromstring(INCOMPLETE_FEEDBACK_HTML)
    source_tree.append(feedback_tree)
    return ElementTree.tostring(source_tree, encoding='unicode', method='html')


INCOMPLETE_FEEDBACK_HTML = """
  <div class="incomplete-div hide">
    <i class="fa fa-exclamation" aria-hidden="true"></i>
    <div class="text-title">
      <span class="incomplete-feedback-title"></span>:
      <span class="interaction-count">4/5</span>
    </div>
    <div class="progress-bg">
      <div class="bar-straight" style="width:35%">
        <p class="progress-percent"></p>
      </div>
    </div>
    <p class="incomplete-feedback">You need to complete all Assessments</p>
  </div>
"""

FEEDBACK_HTML = """
<div class="carousel-end">
  <div class="progress-div">
    <i class="fa fa-times" aria-hidden="true"></i>
    <i class="fa fa-check" aria-hidden="true"></i>
    <span class="title title-feedback">Sorry, you have failed!</span>
    <div class="progress">
      <div class="barOverflow">
        <div class="bar-half-circle"></div>
      </div>
      <div id="pass">
        <div class="score-info">
          <div class="info">Passing Score</div>
          <div class="number">70%</div>
        </div>
      </div>
      <div class="progressbar-text">
        <span class="your-score">Your Score</span>
        <span class="score-value">70</span>
      </div>
    </div>
    <p class="passing-msg">You can proceed on to the next step.</p>
    <button type="button" class="slide-link-button hide">Goto URL</button>
  </div>
</div>
"""


def resource_string(path):
    """Handy helper for getting resources from our kit.
    :param path: (str) path of the resource to load

    :return: (str) encoded resource path
    """
    data = pkg_resource_string(__name__, path)
    return data.decode("utf8")


def render_template(template_path, context):
    """
    render resorce using django template engine and the give content object to it.
    :param template_path: (str) path of the resource to load
    :param context: {} dic object to pass to django template

    :return: template.render
    """
    template_str = resource_string(template_path)
    template = Template(template_str)
    return template.render(Context(context))
