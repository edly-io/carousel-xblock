// Hello.
//
// This is JSHint, a tool that helps to detect errors and potential
// problems in your JavaScript code.
//
// To start, simply enter some JavaScript anywhere on this page. Your
// report will appear on the right side.
//
// Additionally, you can toggle specific options in the Configure
// menu.

/* Javascript for EdlyCarouselXBlock. */

// scroll gallery init
function initCarousel(xblock, usageID, element, audioPlayers) {
	jQuery('.carousel', element).scrollGallery({
		mask: '.mask',
		slider: '.slideset',
		slides: '.slide',
		btnPrev: 'a.btn-prev',
		btnNext: 'a.btn-next',
		stretchSlideToMask: true,
		maskAutoSize: true,
		generatePagination: '.pagination',
		autoRotation: false,
		switchTime: 3000,
		animSpeed: 300,
		step: 1,
		xblock: xblock,
		circularRotation: true,
        usuageID: usageID,
        audioPlayers: audioPlayers
	});
}

function EdlyCarouselXBlock(runtime, element, params) {

    var _EdlyCarouselXBlock = this, USAGE_ID = $(element).attr("data-usage-id") || $(element).data("usage");
    _EdlyCarouselXBlock.element = element;

    _EdlyCarouselXBlock.params = params;
    _EdlyCarouselXBlock.response = null;
    _EdlyCarouselXBlock.nextBtnClass = '';
    _EdlyCarouselXBlock.resetState = false;
    _EdlyCarouselXBlock.containerDiv = null;
    _EdlyCarouselXBlock.responseUpdated = true;
    _EdlyCarouselXBlock.selected_choices = null;
    _EdlyCarouselXBlock.selected_choices_text = null;
    _EdlyCarouselXBlock.OPTION_WRONG = 'option-wrong';
    _EdlyCarouselXBlock.OPTION_CORRECT = 'option-correct';

    _EdlyCarouselXBlock.URL = {
        GET_STATE: runtime.handlerUrl(element, 'get_user_state'),
        SUBMIT_STUDENT_RESPONSE: runtime.handlerUrl(element, 'submit_student_response'),
    };

    _EdlyCarouselXBlock.SELECTOR = {
        SCORE: ".info",
        TITLE: ".title",
        OPTIONS: ".options",
        CAROUSEL: ".carousel",
        START_BUTTON: '#start',
        PASSING_INFO: '.number',
        WRONG_ICON: '.fa-times',
        SCORE_INFO: '.score-info',
        CORRECT_ICON: '.fa-check',
        YOUR_SCORE: '.your-score',
        QUESTION: '.question-text',
        PASSING_MSG: ".passing-msg",
        ATTEMPTS_DIV: ".attempts-div",
        START_PAGE: ".carousel-start",
        CAROUSEL_END: '.carousel-end',
        ACTIVE_SLIDE: '.slide.active',
        LOADING_BAR: '.transparent-bg',
        LINK_BUTTON: '.slide-link-button',
        FEEDBACK_TITLE: '.title-feedback',
        ASSESSMENT_CONTAINER: '.assessment-container',

        PROGRESS_DIV: '.progress-div',
        BAR_STRAIGHT: '.bar-straight',
        PROGRESS_PERCENT: '.progress-percent',
        INTERACTION_COUNT: '.interaction-count',
        INCOMPLETE_FEEDBACK_DIV: '.incomplete-div',
        INCOMPLETE_FEEDBACK_MSG: '.incomplete-feedback',
        INCOMPLETE_FEEDBACK_TITLE: '.incomplete-feedback-title',

    };

    _EdlyCarouselXBlock.VIEW = {
        OPTIONS: $(_EdlyCarouselXBlock.SELECTOR.OPTIONS, element),
        CAROUSEL: $(_EdlyCarouselXBlock.SELECTOR.CAROUSEL, element),
        START_PAGE: $(_EdlyCarouselXBlock.SELECTOR.START_PAGE, element),
        LOADING_BAR: $(_EdlyCarouselXBlock.SELECTOR.LOADING_BAR, element),
        START_BUTTON: $(_EdlyCarouselXBlock.SELECTOR.START_BUTTON, element),

        PROGRESS_DIV: $(_EdlyCarouselXBlock.SELECTOR.PROGRESS_DIV, element),
        INCOMPLETE_FEEDBACK_DIV: $(_EdlyCarouselXBlock.SELECTOR.INCOMPLETE_FEEDBACK_DIV, element),
        INCOMPLETE_FEEDBACK_MSG: $(_EdlyCarouselXBlock.SELECTOR.INCOMPLETE_FEEDBACK_MSG, element),
        INCOMPLETE_FEEDBACK_TITLE: $(_EdlyCarouselXBlock.SELECTOR.INCOMPLETE_FEEDBACK_TITLE, element),
    };

    $(function ($) {

        $(document).keydown(function(objEvent) {
            if (objEvent.keyCode === 9) { //tab pressed
                objEvent.preventDefault();
            }
        });

        $(_EdlyCarouselXBlock.VIEW.OPTIONS, element).click(function(eventObject){
            _EdlyCarouselXBlock.handleOptionClick(eventObject);
        });

        $('.mrq-submit', element).click(function(eventObject) {
            _EdlyCarouselXBlock.handleSubmit(eventObject);
        });

        $(_EdlyCarouselXBlock.VIEW.START_BUTTON).click(function (e) {
            e.preventDefault();
            if (params.has_slides) {
                _EdlyCarouselXBlock.startCarousel();
                var audioPlayers = $('.audio-player', element);
                initCarousel(_EdlyCarouselXBlock, USAGE_ID, element, audioPlayers);
            } else {
                alert("No slides found, add slides from studio to start the Carousel");
            }
        });

        const prevBtn = $(".btn-prev");

        prevBtn.addClass('disabled');
        prevBtn.attr("id", 'pre-' + USAGE_ID);
        $(".btn-next").attr("id", 'next-' + USAGE_ID);
        $(".pagination").attr("id", 'pagination-' + USAGE_ID);

        _EdlyCarouselXBlock.setDefaultTexts();

        _EdlyCarouselXBlock.init(function(result) {
            if (result){
                _EdlyCarouselXBlock.response = result;
                _EdlyCarouselXBlock.populateInitialState(result);
            }
        });

        $('div[data-type="summative"]', element).find('.instruction').each(function(id, p) {
            $(p).html('<img class="graded-img" src=' + _EdlyCarouselXBlock.params.graded_image + ' /> ' + p.innerText)
        });

	});
};

EdlyCarouselXBlock.prototype.slideChanged = function() {
    _EdlyCarouselXBlock = this;
    _EdlyCarouselXBlock.resetState = true;
}

EdlyCarouselXBlock.prototype.hideLinkButton = function() {
    _EdlyCarouselXBlock = this;
    $(_EdlyCarouselXBlock.SELECTOR.LINK_BUTTON, _EdlyCarouselXBlock.element).addClass('hide');
}

EdlyCarouselXBlock.prototype.showLinkButton = function() {
    _EdlyCarouselXBlock = this;
    if (_EdlyCarouselXBlock.params.show_link_button) {
        $(_EdlyCarouselXBlock.VIEW.CAROUSEL).find(_EdlyCarouselXBlock.SELECTOR.ACTIVE_SLIDE).addClass("link-slide");
        $(_EdlyCarouselXBlock.SELECTOR.LINK_BUTTON, _EdlyCarouselXBlock.element).removeClass('hide');
    }
}

EdlyCarouselXBlock.prototype.setAssessmentTexts = function() {
    _EdlyCarouselXBlock = this;
    var element = _EdlyCarouselXBlock.element;
    if (_EdlyCarouselXBlock.params.show_link_button) {
        $(_EdlyCarouselXBlock.SELECTOR.CAROUSEL_END, element).addClass('carousel-link-button');
        var button = $(_EdlyCarouselXBlock.SELECTOR.LINK_BUTTON, element);
        $(button).removeClass('hide');
        $(button).text(_EdlyCarouselXBlock.params.link_button_text);
        $(button).click(function (e) {
            e.preventDefault();
            _EdlyCarouselXBlock.loadCertificateLink();
        });
    } else {
        _EdlyCarouselXBlock.hideLinkButton();
    }

    $(_EdlyCarouselXBlock.SELECTOR.PASSING_MSG, element).text(_EdlyCarouselXBlock.params.passing_msg);
    $(_EdlyCarouselXBlock.SELECTOR.SCORE, element).text(_EdlyCarouselXBlock.params.marker_passing_score);
    $(_EdlyCarouselXBlock.SELECTOR.YOUR_SCORE, element).text(_EdlyCarouselXBlock.params.progressbar_text);
}

EdlyCarouselXBlock.prototype.loadCertificateLink = function() {
    _EdlyCarouselXBlock = this;
    window.open(_EdlyCarouselXBlock.params.link_button_url, '_parent');
}

EdlyCarouselXBlock.prototype.showLoader = function() {
    _EdlyCarouselXBlock = this;
    $(_EdlyCarouselXBlock.VIEW.LOADING_BAR).removeClass('hide');
}

EdlyCarouselXBlock.prototype.hideLoader = function() {
    _EdlyCarouselXBlock = this;
    $(_EdlyCarouselXBlock.VIEW.LOADING_BAR).addClass('hide');
}

EdlyCarouselXBlock.prototype.setDefaultTexts = function() {

    _EdlyCarouselXBlock = this;
    $(_EdlyCarouselXBlock.VIEW.INCOMPLETE_FEEDBACK_MSG).text(_EdlyCarouselXBlock.params.incomplete_feedback);
    $(_EdlyCarouselXBlock.VIEW.INCOMPLETE_FEEDBACK_TITLE).text(_EdlyCarouselXBlock.params.incomplete_feedback_title);
    if (_EdlyCarouselXBlock.params.is_summative && _EdlyCarouselXBlock.params.max_attempts > 0 ) {
        var message = _EdlyCarouselXBlock.getAttemptsText(_EdlyCarouselXBlock.params.max_attempts);
        $('span.counter', _EdlyCarouselXBlock.element).html(message)
    } else {
        _EdlyCarouselXBlock.hideElement($(_EdlyCarouselXBlock.SELECTOR.ATTEMPTS_DIV, _EdlyCarouselXBlock.element));
    }
    if (_EdlyCarouselXBlock.params.is_summative && typeof _EdlyCarouselXBlock.element !== 'undefined') {
        _EdlyCarouselXBlock.setAssessmentTexts();
    }
}

EdlyCarouselXBlock.prototype.init = function(callBack){
    _EdlyCarouselXBlock = this;
    _EdlyCarouselXBlock.showLoader();
    $.get(_EdlyCarouselXBlock.URL.GET_STATE, function (result) {
        _EdlyCarouselXBlock.hideLoader();
        if (callBack){
            callBack(result);
        }
    });
}

EdlyCarouselXBlock.prototype.generateNumber = function(num){
    if (num === null){
        return Math.floor(1000 + Math.random() * 9000).toString();
    }
    var newNum = num;
    while (newNum === num){
        newNum = Math.floor(1000 + Math.random() * 9000).toString();
    }
    return newNum;
}

EdlyCarouselXBlock.prototype.setClasses = function(){
    _EdlyCarouselXBlock = this;
    _EdlyCarouselXBlock.ids = {}
    var number = _EdlyCarouselXBlock.generateNumber(null);
    $(_EdlyCarouselXBlock.element).find('.assessment-container').each(function() {
        var id = this.id;
        $(this).find('.answer-div').each(function() {
            var $input = $(this).find('input');
            if ($input.hasClass('correct')) {
                $input.removeClass('correct');
                $input.addClass(number);
                _EdlyCarouselXBlock.ids[id] = number;
            }
            else {
                $input.addClass(_EdlyCarouselXBlock.generateNumber(number));
            }
        })
    })
}

EdlyCarouselXBlock.prototype.populateInitialState = function(response){
    _EdlyCarouselXBlock = this;
    _EdlyCarouselXBlock.setClasses();
    Object.entries(response.user_response).forEach(function([key, value]) {
        _EdlyCarouselXBlock.containerDiv = $("#" + key, _EdlyCarouselXBlock.element);

        value.choices.map(function(itemID) {
            var selectedItem = $("#" + itemID, _EdlyCarouselXBlock.element).prop('checked', true);
            _EdlyCarouselXBlock.highlightSelectedItem(selectedItem[0]);
        })

        _EdlyCarouselXBlock.handleSubmit(null);
        _EdlyCarouselXBlock.updateAttemptCounter(value);

    });
}

EdlyCarouselXBlock.prototype.lastSlide = function(btnNext, className) {
    _EdlyCarouselXBlock = this;
    var isSummative = _EdlyCarouselXBlock.params.is_summative;
    var result = _EdlyCarouselXBlock.response;

    if (!result.completed_and_passed && $(_EdlyCarouselXBlock.VIEW.INCOMPLETE_FEEDBACK_DIV)[0]) {
        _EdlyCarouselXBlock.updateNextBtn(btnNext, 'hide')
		_EdlyCarouselXBlock.showAssessmentInCompleteMsg(result.interactions, result.total_assessments)
        return
    }
    _EdlyCarouselXBlock.hideAssessmentInCompleteMsg()
    isSummative ? _EdlyCarouselXBlock.showUserProgress(btnNext, className) : _EdlyCarouselXBlock.showFeedback(btnNext, className)
}

EdlyCarouselXBlock.prototype.updateNextBtn = function(btnNext, className) {
    _EdlyCarouselXBlock = this;
    _EdlyCarouselXBlock.nextBtnClass = className;
    btnNext.addClass(className);
}

EdlyCarouselXBlock.prototype.showFeedback = function(btnNext, className) {
    _EdlyCarouselXBlock = this;
    _EdlyCarouselXBlock.postUserGrades(JSON.stringify({'value': 1.0, 'last_slide': true}));
    _EdlyCarouselXBlock.nextBtnClass = className;
    _EdlyCarouselXBlock.updateNextBtn(btnNext, className)
}

EdlyCarouselXBlock.prototype.showUserProgress = function(btnNext, className) {
    _EdlyCarouselXBlock = this;
    // To avoid progress bar re-draw on screen resize
    if (_EdlyCarouselXBlock.responseUpdated){
        if (_EdlyCarouselXBlock.response){
            _EdlyCarouselXBlock.showPercentageMarkers(btnNext, className)
            _EdlyCarouselXBlock.responseUpdated = false;
        }
    } else {
        _EdlyCarouselXBlock.updateNextBtn(btnNext, _EdlyCarouselXBlock.nextBtnClass)
    }
}

EdlyCarouselXBlock.prototype.setPassingUI = function passingUI(div) {
    _EdlyCarouselXBlock = this;
    $(div).find(_EdlyCarouselXBlock.SELECTOR.WRONG_ICON).addClass('hide');
    $(div).find(_EdlyCarouselXBlock.SELECTOR.CORRECT_ICON).addClass('hide').removeClass('hide');
    $(div).find(_EdlyCarouselXBlock.SELECTOR.FEEDBACK_TITLE).text(_EdlyCarouselXBlock.params.passing_title);
    $(div).find(_EdlyCarouselXBlock.SELECTOR.PASSING_MSG).text(_EdlyCarouselXBlock.params.passing_msg).removeClass('hide');
}

EdlyCarouselXBlock.prototype.setFailingUI = function failingUI(div) {
    _EdlyCarouselXBlock = this;
    $(div).find(_EdlyCarouselXBlock.SELECTOR.PASSING_MSG).addClass('hide');
    $(div).find(_EdlyCarouselXBlock.SELECTOR.CORRECT_ICON).addClass('hide');
    $(div).find(_EdlyCarouselXBlock.SELECTOR.WRONG_ICON).removeClass('hide').removeClass('hide');
    $(div).find(_EdlyCarouselXBlock.SELECTOR.FEEDBACK_TITLE).text(_EdlyCarouselXBlock.params.failing_title);
}

EdlyCarouselXBlock.prototype.showAssessmentInCompleteMsg = function(interactions, total_assessments) {
    _EdlyCarouselXBlock = this;
    var incompleteDiv = _EdlyCarouselXBlock.VIEW.INCOMPLETE_FEEDBACK_DIV;
    $(incompleteDiv).removeClass("hide");
	$(_EdlyCarouselXBlock.VIEW.PROGRESS_DIV).addClass("hide");
    var updateMessage = interactions + "/" + total_assessments;
    var progress = ((interactions / total_assessments) * 100) + "%"
    $(incompleteDiv).find(_EdlyCarouselXBlock.SELECTOR.BAR_STRAIGHT).width(progress);
    $(incompleteDiv).find(_EdlyCarouselXBlock.SELECTOR.INTERACTION_COUNT).text(updateMessage);
	$(_EdlyCarouselXBlock.VIEW.CAROUSEL).find(_EdlyCarouselXBlock.SELECTOR.ACTIVE_SLIDE).addClass("progress-slide");
}

EdlyCarouselXBlock.prototype.hideAssessmentInCompleteMsg = function() {
    _EdlyCarouselXBlock = this;
	$(_EdlyCarouselXBlock.VIEW.PROGRESS_DIV).removeClass("hide");
    $(_EdlyCarouselXBlock.VIEW.INCOMPLETE_FEEDBACK_DIV).addClass("hide");
	$(_EdlyCarouselXBlock.VIEW.CAROUSEL).find(_EdlyCarouselXBlock.SELECTOR.ACTIVE_SLIDE).removeClass("progress-slide");
}

EdlyCarouselXBlock.prototype.showPercentageMarkers = function(btnNext, className) {
    _EdlyCarouselXBlock = this;
    var result = _EdlyCarouselXBlock.response;
    var passed = result.user_progress >= (_EdlyCarouselXBlock.params.passing_marks / 100)
    var div = $(_EdlyCarouselXBlock.SELECTOR.CAROUSEL_END, _EdlyCarouselXBlock.element)

    if (_EdlyCarouselXBlock.params.passing_marks === 100) {
        $(div).find(_EdlyCarouselXBlock.SELECTOR.SCORE_INFO).addClass("hide")
    } else {
        $(div).find(_EdlyCarouselXBlock.SELECTOR.PASSING_INFO).text(_EdlyCarouselXBlock.params.passing_marks + "%")
    }

    var color = passed ? '#29cb97' : '#FF7A00';
    passed ? _EdlyCarouselXBlock.showLinkButton() : _EdlyCarouselXBlock.hideLinkButton()

    var classToAdd = passed ? 'hide' : className;
    passed ? _EdlyCarouselXBlock.setPassingUI(div) : _EdlyCarouselXBlock.setFailingUI(div);

    classToAdd += " last-assessment";
    _EdlyCarouselXBlock.updateNextBtn(btnNext, classToAdd);
    var updatedColor = {"border-bottom-color": color, "border-right-color": color};
    var bar = $(div).find(".bar-half-circle");
    $(bar).css(updatedColor)
    var val = $(div).find(".score-value");

    var user_progress = result.user_progress * 100;
    $(val).text(user_progress);
    var percent = parseInt( val.text(), 10);
    $({p: 0}).animate({p: percent}, {
        duration: 1700,
        easing: "swing",
        step: function(p) {
            bar.css({
                transform: "rotate(" + (45 + (p * 1.8)) + "deg)", // 100%=180° so: ° = % * 1.8
                // 45 is to add the needed rotation to have the green borders at the bottom
            });
            val.text(p | 0);
        }
    });
}

EdlyCarouselXBlock.prototype.applySelectionStyle = function(option, isCorrect) {
    _EdlyCarouselXBlock = this;
    let classToAdd = isCorrect ? _EdlyCarouselXBlock.OPTION_CORRECT : _EdlyCarouselXBlock.OPTION_WRONG;
    $(option).parents('div.answer-div').addClass(classToAdd);
}

EdlyCarouselXBlock.prototype.showCorrectFeedback = function(resultArea) {
    $(resultArea).find(".failure-title").addClass("hidden");
    $(resultArea).find(".failure-details").addClass("hidden");
    $(resultArea).find(".success-title").removeClass("hidden");
    $(resultArea).find(".success-details").removeClass("hidden");
    $(resultArea).removeClass('wrong-selection').addClass('correct-selection');
}

EdlyCarouselXBlock.prototype.showWrongFeedback = function(resultArea) {
    $(resultArea).find(".success-title").addClass("hidden");
    $(resultArea).find(".success-details").addClass("hidden");
    $(resultArea).find(".failure-title").removeClass("hidden");
    $(resultArea).find(".failure-details").removeClass("hidden");
    $(resultArea).addClass('wrong-selection').removeClass('correct-selection');
}

EdlyCarouselXBlock.prototype.disableCurrentAssessment = function() {
    _EdlyCarouselXBlock = this;
    _EdlyCarouselXBlock.disableSubmitBtn();
    $(_EdlyCarouselXBlock.containerDiv).addClass('disabled');
    $(_EdlyCarouselXBlock.containerDiv).find('.options').attr('disabled', 'disabled');
    _EdlyCarouselXBlock.containerDiv = null;
}

EdlyCarouselXBlock.prototype.getAttemptsText = function(counter) {
    _EdlyCarouselXBlock = this;
    var attemptsUpdated = _EdlyCarouselXBlock.params.attempts_text.replace("COUNTER", "<b>" + counter + "</b>");
    return counter === 1 ? _EdlyCarouselXBlock.params.last_attempt_text : attemptsUpdated
}

EdlyCarouselXBlock.prototype.hideElement = function(element) {
    $(element).addClass('hide');
}

EdlyCarouselXBlock.prototype.updateAttemptCounter = function(response) {
    _EdlyCarouselXBlock = this;

    var attemptsDiv = $(_EdlyCarouselXBlock.containerDiv).find(_EdlyCarouselXBlock.SELECTOR.ATTEMPTS_DIV)
    if (response.type === 'summative') {
        if (response.attempts_remaining >= 0) {
            response.attempts_remaining === 0 ? _EdlyCarouselXBlock.disableCurrentAssessment() : _EdlyCarouselXBlock.disableSubmitBtn()
            var message = _EdlyCarouselXBlock.getAttemptsText(response.attempts_remaining);
            $(attemptsDiv).find("span.counter").html(message);
        } else if (_EdlyCarouselXBlock.params.max_attempts <= 0) {
            _EdlyCarouselXBlock.hideElement(attemptsDiv);
        }
    } else {
        if (response.type === 'survey') {
            _EdlyCarouselXBlock.disableCurrentAssessment()
        }
        _EdlyCarouselXBlock.hideElement(attemptsDiv);
    }
}

EdlyCarouselXBlock.prototype.postUserGrades = function(data, callback) {
    _EdlyCarouselXBlock = this;
    $.post(_EdlyCarouselXBlock.URL.SUBMIT_STUDENT_RESPONSE, data)
    .done(function( response ) {
        if (callback) {
            callback(response);
        }
    });
}

EdlyCarouselXBlock.prototype.assessmentType = function() {
    _EdlyCarouselXBlock = this;
    return $(_EdlyCarouselXBlock.containerDiv).attr('data-type');
}

EdlyCarouselXBlock.prototype.isSurvey = function() {
    _EdlyCarouselXBlock = this;
    return _EdlyCarouselXBlock.assessmentType() === 'survey';
}

EdlyCarouselXBlock.prototype.handleResponseFeedback = function(response) {
    _EdlyCarouselXBlock = this;
    if (response.result === 'success') {
        _EdlyCarouselXBlock.nextBtnClass = '';
        _EdlyCarouselXBlock.responseUpdated = true;
        _EdlyCarouselXBlock.response = response;
        _EdlyCarouselXBlock.updateAttemptCounter({attempts_remaining: response.attempts_remaining,
                                                  type: response.type});
    }
}

EdlyCarouselXBlock.prototype.submitAttemptResult = function(grade) {
    _EdlyCarouselXBlock = this;

    var status = {grade: grade, choices: _EdlyCarouselXBlock.selected_choices,
                  type: _EdlyCarouselXBlock.assessmentType()}
    if (_EdlyCarouselXBlock.isSurvey()) {
        status['response'] = _EdlyCarouselXBlock.selected_choices_text.join(', ');
        status['question'] = $(_EdlyCarouselXBlock.containerDiv).find(_EdlyCarouselXBlock.SELECTOR.QUESTION).text()
    }
    var divID = $(_EdlyCarouselXBlock.containerDiv).attr('id');
    var data = {};
    data[divID] = status;
	userResponse = JSON.stringify(data);
	_EdlyCarouselXBlock.showLoader();
    _EdlyCarouselXBlock.postUserGrades(userResponse, function (response) {
        _EdlyCarouselXBlock.hideLoader();
        _EdlyCarouselXBlock.handleResponseFeedback(response);
    })
}

EdlyCarouselXBlock.prototype.showSubmissionResults = function(isCorrect, submitResults) {
    _EdlyCarouselXBlock = this;
    var resultArea = $(_EdlyCarouselXBlock.containerDiv).children(".result-column");
    if (resultArea) {
        $(resultArea).removeClass("hidden");
        var grade = isCorrect ? 1 : 0
        isCorrect ? _EdlyCarouselXBlock.showCorrectFeedback(resultArea
        ) : _EdlyCarouselXBlock.showWrongFeedback(resultArea);
    }
    if (submitResults) {
        _EdlyCarouselXBlock.submitAttemptResult(grade);
    }
}

EdlyCarouselXBlock.prototype.updateContainerDiv = function(option) {
    _EdlyCarouselXBlock = this;
    if (option) {
        _EdlyCarouselXBlock.containerDiv = $(option.target).parents(_EdlyCarouselXBlock.SELECTOR.ASSESSMENT_CONTAINER);
    }
}

EdlyCarouselXBlock.prototype.handleSubmit = function(submitBtn) {
    _EdlyCarouselXBlock = this;
    var isCorrect = true, partialCorrect = false, partialWrong = false;
    _EdlyCarouselXBlock.updateContainerDiv(submitBtn);
    var isResponseBased = _EdlyCarouselXBlock.containerDiv && _EdlyCarouselXBlock.containerDiv.prop('id').includes('resp');
    _EdlyCarouselXBlock.disableSubmitBtn();

    _EdlyCarouselXBlock.selected_choices = [];
    _EdlyCarouselXBlock.selected_choices_text = [];
    var options = $(_EdlyCarouselXBlock.containerDiv).find(".options")
    $(options).each(function(id, option) {
        var optionClasses = $(option).attr('class');
        var includeClass = optionClasses.includes(_EdlyCarouselXBlock.ids[_EdlyCarouselXBlock.containerDiv.prop('id')]);
        if (option.checked) {
            _EdlyCarouselXBlock.selected_choices.push(option.id);
            isCorrect = includeClass && isCorrect;
            _EdlyCarouselXBlock.applySelectionStyle(option, includeClass);
            if (option.labels.length > 0 ) {
                _EdlyCarouselXBlock.selected_choices_text.push(option.labels[0].innerText);
            }
            if (isResponseBased){
                $(option).parents('.answer-div').find('.answer-feedback.' + (includeClass ? 1 : 0)).removeClass('hidden');
                if (includeClass){
                    partialCorrect = true;
                }
                else {
                    partialWrong = true;
                }
            }
        } else if (option.type === 'checkbox'){
            isCorrect = isCorrect && !includeClass;
        }
    })
    if (isResponseBased && (partialCorrect && (partialWrong || !isCorrect))){
        $(_EdlyCarouselXBlock.containerDiv).find("#result").removeClass('hidden');
    }

    _EdlyCarouselXBlock.showSubmissionResults(isCorrect, submitBtn !== null);
    _EdlyCarouselXBlock.resetState = true;
}

EdlyCarouselXBlock.prototype.enableSubmitBtn = function() {
    _EdlyCarouselXBlock = this;
    var btnSubmit = $(_EdlyCarouselXBlock.containerDiv).find(".mrq-submit");
    $(btnSubmit).removeClass("button-disabled").removeAttr('disabled');
}

EdlyCarouselXBlock.prototype.disableSubmitBtn = function() {
    _EdlyCarouselXBlock = this;
    var btnSubmit = $(_EdlyCarouselXBlock.containerDiv).find(".mrq-submit");
    $(btnSubmit).addClass("button-disabled").attr('disabled', 'disabled');
}

EdlyCarouselXBlock.prototype.resetStyles = function() {
    _EdlyCarouselXBlock = this;
    var resultsArea = $(_EdlyCarouselXBlock.containerDiv).children(".result-column");
    var options = $(_EdlyCarouselXBlock.containerDiv).find(".options");
    var classesToRemove = _EdlyCarouselXBlock.OPTION_WRONG + " " + _EdlyCarouselXBlock.OPTION_CORRECT;
    resultsArea.removeClass('wrong-selection correct-selection').addClass("hidden");
    $(_EdlyCarouselXBlock.containerDiv).find("#result").addClass("hidden");
    $(options).each(function(id, option) {
        $(option).parents("div").removeClass(classesToRemove);
        $(option).parents(".answer-div").find('.answer-feedback').addClass('hidden');
    })
    _EdlyCarouselXBlock.resetState = false;
}

EdlyCarouselXBlock.prototype.highlightSelectedItem = function(item) {
    _EdlyCarouselXBlock = this;
    var enableButton = false;
    var oneOptionSelected = false;
    var similarOptions = $("input[name='" + item.name + "']", _EdlyCarouselXBlock.element);
    var btnSubmit = $(_EdlyCarouselXBlock.containerDiv).find(".mrq-submit");
    similarOptions.each(function(id, option) {
        oneOptionSelected = oneOptionSelected || option.checked
    })
    oneOptionSelected ? _EdlyCarouselXBlock.enableSubmitBtn() : _EdlyCarouselXBlock.disableSubmitBtn()
    if (_EdlyCarouselXBlock.resetState) {
        _EdlyCarouselXBlock.resetStyles();
    }
}

EdlyCarouselXBlock.prototype.handleOptionClick = function(option) {
    _EdlyCarouselXBlock = this;
    _EdlyCarouselXBlock.updateContainerDiv(option)
    _EdlyCarouselXBlock.highlightSelectedItem(option.target);
}

EdlyCarouselXBlock.prototype.startCarousel = function() {
    _EdlyCarouselXBlock = this;
    $(_EdlyCarouselXBlock.VIEW.CAROUSEL).show();
    $(_EdlyCarouselXBlock.VIEW.START_PAGE).hide();
}

/*
 * jQuery Carousel plugin
 */
;(function($){

	// detect device type
	var isTouchDevice = /Windows Phone/.test(navigator.userAgent) || ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
	function ScrollGallery(options) {
		this.options = $.extend({
			mask: 'div.mask',
			slider: '>*',
			slides: '>*',
			activeClass: 'active',
			disabledClass: 'disabled',
			lastClass: 'last',
			btnPrev: 'prev-' + options.usuageID,
			btnNext: 'next-' + options.usuageID,
			generatePagination: false,
			pagerList: '<ul>',
			pagerListItem: '<li class="page-item" data-id="ITEM_ID"><a href="javascript:;" class="anc"></a></li>',
			pagerListBlankItem: '<li class="page-item-blank hidden" data-id="BLANK_ID"><span class="anc">...</span></li>',
			pagerListItemText: 'a',
			pagerLinks: '.pagination li',
			currentNumber: 'span.current-num',
			totalNumber: 'span.total-num',
			btnPlay: '.btn-play',
			btnPause: '.btn-pause',
			btnPlayPause: '.btn-play-pause',
			galleryReadyClass: 'gallery-js-ready',
			autorotationActiveClass: 'autorotation-active',
			autorotationDisabledClass: 'autorotation-disabled',
			stretchSlideToMask: false,
			circularRotation: false,
			disableWhileAnimating: false,
			autoRotation: false,
			pauseOnHover: isTouchDevice ? false : true,
			maskAutoSize: false,
			switchTime: 4000,
			animSpeed: 600,
			event: 'click',
			swipeThreshold: 15,
			handleTouch: true,
			vertical: false,
			useTranslate3D: false,
			step: false,
			paginationThreshold: 6,
			shortenPagination: true,
			audioPlayers: options.audioPlayers
		}, options);
		this.init();
	}
	ScrollGallery.prototype = {
		init: function() {
			if (this.options.holder) {
				this.findElements();
				this.attachEvents();
				this.refreshPosition();
				this.refreshState(true);
				this.resumeRotation();
				this.makeCallback('onInit', this);
			}
		},
		findElements: function() {
			// define dimensions proporties
			this.fullSizeFunction = this.options.vertical ? 'outerHeight' : 'outerWidth';
			this.innerSizeFunction = this.options.vertical ? 'height' : 'width';
			this.slideSizeFunction = 'outerHeight';
			this.maskSizeProperty = 'height';
			this.animProperty = this.options.vertical ? 'marginTop' : 'marginLeft';

			// control elements
			this.gallery = $(this.options.holder).addClass(this.options.galleryReadyClass);
			this.mask = this.gallery.find(this.options.mask);
			this.slider = this.mask.find(this.options.slider);
			this.slides = this.slider.find(this.options.slides);
			this.btnPrev = this.gallery.find(this.options.btnPrev);
			this.btnNext = this.gallery.find(this.options.btnNext);
			this.currentStep = 0; this.stepsCount = 0;

			// get start index
			if (this.options.step === false) {
				var activeSlide = this.slides.filter('.' + this.options.activeClass);
				if (activeSlide.length) {
					this.currentStep = this.slides.index(activeSlide);
				}
			}

			// calculate offsets
			this.calculateOffsets();

			// create gallery pagination
			if (typeof this.options.generatePagination === 'string') {
				this.pagerLinks = $();
				this.buildPagination();
			} else {
				this.pagerLinks = this.gallery.find(this.options.pagerLinks);
				this.attachPaginationEvents();
			}

			// autorotation control buttons
			this.btnPlay = this.gallery.find(this.options.btnPlay);
			this.btnPause = this.gallery.find(this.options.btnPause);
			this.btnPlayPause = this.gallery.find(this.options.btnPlayPause);

			// misc elements
			this.curNum = this.gallery.find(this.options.currentNumber);
			this.allNum = this.gallery.find(this.options.totalNumber);
		},
		attachEvents: function() {
			// bind handlers scope
			var self = this;
			this.bindHandlers(['onWindowResize']);
			$(window).bind('load resize orientationchange', this.onWindowResize);

			// previous and next button handlers
			if (this.btnPrev.length) {
				this.prevSlideHandler = function(e) {
					e.preventDefault();
					self.prevSlide();
				};
				this.btnPrev.bind(this.options.event, this.prevSlideHandler);
			}
			if (this.btnNext.length) {
				this.nextSlideHandler = function(e) {
					e.preventDefault();
					self.nextSlide();
				};
				this.btnNext.bind(this.options.event, this.nextSlideHandler);
			}

			// pause on hover handling
			if (this.options.pauseOnHover && !isTouchDevice) {
				this.hoverHandler = function() {
					if (self.options.autoRotation) {
						self.galleryHover = true;
						self.pauseRotation();
					}
				};
				this.leaveHandler = function() {
					if (self.options.autoRotation) {
						self.galleryHover = false;
						self.resumeRotation();
					}
				};
				this.gallery.bind({mouseenter: this.hoverHandler, mouseleave: this.leaveHandler});
			}

			// autorotation buttons handler
			if (this.btnPlay.length) {
				this.btnPlayHandler = function(e) {
					e.preventDefault();
					self.startRotation();
				};
				this.btnPlay.bind(this.options.event, this.btnPlayHandler);
			}
			if (this.btnPause.length) {
				this.btnPauseHandler = function(e) {
					e.preventDefault();
					self.stopRotation();
				};
				this.btnPause.bind(this.options.event, this.btnPauseHandler);
			}
			if (this.btnPlayPause.length) {
				this.btnPlayPauseHandler = function(e) {
					e.preventDefault();
					if (!self.gallery.hasClass(self.options.autorotationActiveClass)) {
						self.startRotation();
					} else {
						self.stopRotation();
					}
				};
				this.btnPlayPause.bind(this.options.event, this.btnPlayPauseHandler);
			}

			// enable hardware acceleration
			if (isTouchDevice && this.options.useTranslate3D) {
				this.slider.css({'-webkit-transform': 'translate3d(0px, 0px, 0px)'});
			}

			// swipe event handling
			if (isTouchDevice && this.options.handleTouch && window.Hammer && this.mask.length) {
				this.swipeHandler = new Hammer.Manager(this.mask[0]);
				this.swipeHandler.add(new Hammer.Pan({
					direction: self.options.vertical ? Hammer.DIRECTION_VERTICAL : Hammer.DIRECTION_HORIZONTAL,
					threshold: self.options.swipeThreshold
				}));

				this.swipeHandler.on('panstart', function() {
					if (self.galleryAnimating) {
						self.swipeHandler.stop();
					} else {
						self.pauseRotation();
						self.originalOffset = parseFloat(self.slider.css(self.animProperty));
					}
				}).on('panmove', function(e) {
					var tmpOffset = self.originalOffset + e[self.options.vertical ? 'deltaY' : 'deltaX'];
					tmpOffset = Math.max(Math.min(0, tmpOffset), self.maxOffset);
					self.slider.css(self.animProperty, tmpOffset);
				}).on('panend', function(e) {
					self.resumeRotation();
					if (e.distance > self.options.swipeThreshold) {
						if (e.offsetDirection === Hammer.DIRECTION_RIGHT || e.offsetDirection === Hammer.DIRECTION_DOWN) {
							self.nextSlide();
						} else {
							self.prevSlide();
						}
					} else {
						self.switchSlide();
					}
				});
			}
		},
		onWindowResize: function() {
			if (!this.galleryAnimating) {
				this.calculateOffsets();
				this.refreshPosition();
				this.buildPagination();
				this.refreshState();
				this.resizeQueue = false;
			} else {
				this.resizeQueue = true;
			}
		},
		refreshPosition: function() {
			this.currentStep = Math.min(this.currentStep, this.stepsCount - 1);
			this.tmpProps = {};

			this.tmpProps[this.animProperty] = this.getStepOffset();
			this.slider.stop().css(this.tmpProps);
		},
		calculateOffsets: function() {
			var self = this, tmpOffset, tmpStep;
			if (this.options.stretchSlideToMask) {
				var tmpObj = {};
				tmpObj[this.innerSizeFunction] = this.mask[this.innerSizeFunction]();
				this.slides.css(tmpObj);
			}

			this.maskSize = this.mask[this.innerSizeFunction]();
			this.sumSize = this.getSumSize();
			this.maxOffset = this.maskSize - this.sumSize;

			// vertical gallery with single size step custom behavior
			if (this.options.vertical && this.options.maskAutoSize) {
				this.options.step = 1;
				this.stepsCount = this.slides.length;
				this.stepOffsets = [0];
				tmpOffset = 0;
				for (var i = 0; i < this.slides.length; i++) {
					tmpOffset -= this.mask[this.innerSizeFunction]()
					this.stepOffsets.push(tmpOffset);
				}
				this.maxOffset = tmpOffset;
				return;
			}

			// scroll by slide size
			if (typeof this.options.step === 'number' && this.options.step > 0) {
				this.slideDimensions = [];
				this.slides.each($.proxy(function(ind, obj){
					self.slideDimensions.push( this.mask[this.innerSizeFunction]() );
				}, this));

				// calculate steps count
				this.stepOffsets = [0];
				this.stepsCount = 1;
				tmpOffset = tmpStep = 0;
				while (tmpOffset > this.maxOffset) {
					tmpOffset -= this.mask[this.innerSizeFunction]();
					tmpStep += this.options.step;
					this.stepOffsets.push(Math.max(tmpOffset, this.maxOffset));
					this.stepsCount++;
				}
			}
			// scroll by mask size
			else {
				// define step size
				this.stepSize = this.maskSize;

				// calculate steps count
				this.stepsCount = 1;
				tmpOffset = 0;
				while (tmpOffset > this.maxOffset) {
					tmpOffset -= this.stepSize;
					this.stepsCount++;
				}
			}
		},
		getSumSize: function() {
			var sum = 0;
			this.slides.each($.proxy(function(ind, obj){
				sum += this.mask[this.innerSizeFunction]();
			}, this));
			this.slider.css(this.innerSizeFunction, sum);
			return sum;
		},
		getStepOffset: function(step) {
			step = step || this.currentStep;
			if (typeof this.options.step === 'number') {
				return this.stepOffsets[this.currentStep];
			} else {
				return Math.min(0, Math.max(-this.currentStep * this.stepSize, this.maxOffset));
			}
		},
		getSlideSize: function(i1, i2) {
			var sum = 0;
			for (var i = i1; i < Math.min(i2, this.slideDimensions.length); i++) {
				sum += this.slideDimensions[i];
			}
			return sum;
		},
		hideDottedSymbol: function(id) {
		    $('li[data-id="blank-' + id + '"]').addClass('hidden');
		},
		showDottedSymbol: function(id) {
		    $('li[data-id="blank-' + id + '"]').removeClass('hidden');
		},
		showFirstFiveButtons: function() {
		    $(".page-item").addClass("hidden")
		    for (var i = 0; i < 4; i++) {
		        $('li[data-id="item-' + i + '"]').removeClass('hidden');
		    }
		},
		showLastFiveButtons: function() {
		    $(".page-item").addClass("hidden")
		    for (var i = (this.stepsCount - 3); i > (this.stepsCount - 6); i--) {
		        $('li[data-id="item-' + i + '"]').removeClass('hidden');
		    }
		},
		showConnectedButtons: function(id) {
		    $(".page-item").addClass("hidden")
		    $('li[data-id="item-' + (id + 1) + '"]').removeClass('hidden');
		    $('li[data-id="item-' + id + '"]').removeClass('hidden');
		    $('li[data-id="item-' + (id - 1) + '"]').removeClass('hidden');
		},
		isShorteningActive: function(){
		    return (this.options.shortenPagination && this.stepsCount > this.options.paginationThreshold)
		},
		skipShortening: function(){
		    return (!this.options.shortenPagination || this.stepsCount <= this.options.paginationThreshold)
		},
		updatePaginationUI: function() {
		    if (this.isShorteningActive()) {
		        if (this.currentStep <= 2) {
		            this.hideDottedSymbol(1);
		            this.showDottedSymbol(2);
		            this.showFirstFiveButtons();
		        }
		        else if (this.currentStep >= this.stepsCount - 4) {
		             this.hideDottedSymbol(2);
		             this.showDottedSymbol(1);
		             this.showLastFiveButtons();
		        }
		        else if (this.currentStep > 2) {
		            this.showDottedSymbol(1);
		            this.showDottedSymbol(2);
		            this.showConnectedButtons(this.currentStep);
		        }
		    }
		},
		buildPagination: function() {
			if (typeof this.options.generatePagination === 'string') {
				if (!this.pagerHolder) {
					this.pagerHolder = this.gallery.find(this.options.generatePagination);
				}
				if (this.pagerHolder.length && this.oldStepsCount !== this.stepsCount) {
					this.oldStepsCount = this.stepsCount;
					this.pagerHolder.empty();
					this.pagerList = $(this.options.pagerList).appendTo(this.pagerHolder);
					let blankID = 1
					for (var i = 0; i < this.stepsCount; i++) {
					    if (this.isShorteningActive() && (i === 1 || i === this.stepsCount - 2)) {
					            $(this.options.pagerListBlankItem.replace(/BLANK_ID/g, "blank-" + blankID++)).appendTo(this.pagerList);
					    }
					    let pageItem = this.options.pagerListItem.replace(/ITEM_ID/g, 'item-' + i);
					    if (i === 0 || i >= (this.stepsCount - 2)) {
					        pageItem = pageItem.replace(/page-item/g, "")
					    }
						$(pageItem).appendTo(this.pagerList).find(this.options.pagerListItemText).text(i + 1);
					}
					this.pagerLinks = this.pagerList.children();
					this.attachPaginationEvents();
					this.updatePaginationUI();
				}
			}
		},
		getPagerElementIndex: function(currentTarget) {
		    let index = this.pagerLinks.index(currentTarget)
		    if (this.skipShortening() || index === 0) {
		        return index;
		    }
		    if (index + 2 > this.stepsCount) {
		        return index - 2
		    }
		    return index - 1
		},
		attachPaginationEvents: function() {
			var self = this;
			this.pagerLinksHandler = function(e) {
			    if (typeof e.target.href === 'undefined') {
			        e.stopPropagation()
			        return;
			    }
				e.preventDefault();
				self.numSlide(self.getPagerElementIndex(e.currentTarget));
			};
			this.pagerLinks.bind(this.options.event, this.pagerLinksHandler);
		},
		prevSlide: function() {
			if (!(this.options.disableWhileAnimating && this.galleryAnimating)) {
				if (this.currentStep > 0) {
					this.currentStep--;
					this.switchSlide();
				} else if (this.options.circularRotation) {
					this.currentStep = this.stepsCount - 1;
					this.switchSlide();
				}
			}
		},
		nextSlide: function(fromAutoRotation) {
			if (!(this.options.disableWhileAnimating && this.galleryAnimating)) {
				if (this.currentStep < this.stepsCount - 1) {
					this.currentStep++;
					this.switchSlide();
				} else if (this.options.circularRotation || fromAutoRotation === true) {
					this.currentStep = 0;
					this.switchSlide();
				}
			}
		},
		numSlide: function(c) {
			if (this.currentStep !== c) {
				this.currentStep = c;
				this.switchSlide();
			}
		},
		pausePlayers: function(players) {
		    if (typeof players !== 'undefined') {
		        $.each( players, function( _, player ) {
		            player.pause();
                });
            }
		},
		switchSlide: function() {
		    if (typeof wistiaEmbeds !== 'undefined') {
		        this.pausePlayers(wistiaEmbeds);
		    }
		    this.pausePlayers(this.options.audioPlayers);

			var self = this;
			this.galleryAnimating = true;
			this.tmpProps = {};
			this.tmpProps[this.animProperty] = this.getStepOffset();
			this.slider.stop().animate(this.tmpProps, {duration: this.options.animSpeed, complete: function(){
				// animation complete
				self.galleryAnimating = false;
				if (self.resizeQueue) {
					self.onWindowResize();
				}

				// onchange callback
				self.makeCallback('onChange', self);
				self.autoRotate();
			}});
			this.refreshState();

			// onchange callback
			this.updatePaginationUI();
			this.makeCallback('onBeforeChange', this);
		    this.options.xblock.slideChanged();
		},
		getPagerStepIndex: function() {
		    if (this.skipShortening() || this.currentStep === 0) {
		        return this.currentStep
		    }
		    if (this.currentStep + 2 >= this.stepsCount) {
		        return this.currentStep + 2
		    }
		    return this.currentStep + 1
		},
		refreshState: function(initial) {
			if (this.options.step === 1 || this.stepsCount === this.slides.length) {
				this.slides.removeClass(this.options.activeClass).eq(this.currentStep).addClass(this.options.activeClass);
			}
			this.pagerLinks.removeClass(this.options.activeClass).eq(this.getPagerStepIndex()).addClass(this.options.activeClass);
			this.curNum.html(this.currentStep + 1);
			this.allNum.html(this.stepsCount);

			// initial refresh
			if (this.options.maskAutoSize && typeof this.options.step === 'number') {
				this.tmpProps = {};
				this.tmpProps[this.maskSizeProperty] = this.slides.eq(Math.min(this.currentStep, this.slides.length - 1))[this.slideSizeFunction](true);
				this.mask.stop()[initial ? 'css' : 'animate'](this.tmpProps);
			}
			// disabled state
				this.btnPrev.add(this.btnNext).removeClass(this.options.disabledClass);
				this.btnPrev.add(this.btnNext).removeClass(this.options.xblock.nextBtnClass);
				if (this.currentStep === 0) {this.btnPrev.addClass(this.options.disabledClass);}
				if (this.currentStep === this.stepsCount - 1) {
						this.btnPrev.addClass(this.options.disabledClass);
						this.options.xblock.lastSlide(this.btnNext, this.options.lastClass)
				}
			// add class if not enough slides
			this.gallery.toggleClass('not-enough-slides', this.sumSize <= this.maskSize);
		},
		startRotation: function() {
			this.options.autoRotation = true;
			this.galleryHover = false;
			this.autoRotationStopped = false;
			this.resumeRotation();
		},
		stopRotation: function() {
			this.galleryHover = true;
			this.autoRotationStopped = true;
			this.pauseRotation();
		},
		pauseRotation: function() {
			this.gallery.addClass(this.options.autorotationDisabledClass);
			this.gallery.removeClass(this.options.autorotationActiveClass);
			clearTimeout(this.timer);
		},
		resumeRotation: function() {
			if (!this.autoRotationStopped) {
				this.gallery.addClass(this.options.autorotationActiveClass);
				this.gallery.removeClass(this.options.autorotationDisabledClass);
				this.autoRotate();
			}
		},
		autoRotate: function() {
			var self = this;
			clearTimeout(this.timer);
			if (this.options.autoRotation && !this.galleryHover && !this.autoRotationStopped) {
				this.timer = setTimeout(function(){
					self.nextSlide(true);
				}, this.options.switchTime);
			} else {
				this.pauseRotation();
			}
		},
		bindHandlers: function(handlersList) {
			var self = this;
			$.each(handlersList, function(index, handler) {
				var origHandler = self[handler];
				self[handler] = function() {
					return origHandler.apply(self, arguments);
				};
			});
		},
		makeCallback: function(name) {
			if (typeof this.options[name] === 'function') {
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				this.options[name].apply(this, args);
			}
		},
		destroy: function() {
			// destroy handler
			$(window).unbind('load resize orientationchange', this.onWindowResize);
			this.btnPrev.unbind(this.options.event, this.prevSlideHandler);
			this.btnNext.unbind(this.options.event, this.nextSlideHandler);
			this.pagerLinks.unbind(this.options.event, this.pagerLinksHandler);
			this.gallery.unbind('mouseenter', this.hoverHandler);
			this.gallery.unbind('mouseleave', this.leaveHandler);

			// autorotation buttons handlers
			this.stopRotation();
			this.btnPlay.unbind(this.options.event, this.btnPlayHandler);
			this.btnPause.unbind(this.options.event, this.btnPauseHandler);
			this.btnPlayPause.unbind(this.options.event, this.btnPlayPauseHandler);

			// destroy swipe handler
			if (this.swipeHandler) {
				this.swipeHandler.destroy();
			}

			// remove inline styles, classes and pagination
			var unneededClasses = [this.options.galleryReadyClass, this.options.autorotationActiveClass, this.options.autorotationDisabledClass];
			this.gallery.removeClass(unneededClasses.join(' '));
			this.slider.add(this.slides).removeAttr('style');
			if (typeof this.options.generatePagination === 'string') {
				this.pagerHolder.empty();
			}
		}
	};

	// jquery plugin
	$.fn.scrollGallery = function(opt){
		return this.each(function(){
			$(this).data('ScrollGallery', new ScrollGallery($.extend(opt, {holder: this})));
		});
	};
}(jQuery));
