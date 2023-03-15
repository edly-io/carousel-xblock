function EdlyCarouselEditBlock(runtime, element, params) {
    var _EdlyCarouselEditBlock = this, USAGE_ID = $(element).attr("data-usage-id") || $(element).data("usage");
    _EdlyCarouselEditBlock.runtime = runtime;
    _EdlyCarouselEditBlock.element = element;
    _EdlyCarouselEditBlock.params = params
    _EdlyCarouselEditBlock.editors = {}

    _EdlyCarouselEditBlock.URL = {
        SAVE: runtime.handlerUrl(element, 'studio_submit'),
        GET_SLIDES: runtime.handlerUrl(element, 'get_slides')
    }
    _EdlyCarouselEditBlock.SELECTOR = {
        LAST_PAGE: '#last-page',
        START_PAGE: '#start-page',
        INPUT_LIST: USAGE_ID + '-ul',
        DELETE_BUTTON: '.del-button',
        MAX_ATTEMPTS: '#max-attemps',
        DIV_ATTEMPTS: '.div-attempts',
        LINK_OPTIONS: '#link-options',
        EDIT_FORM: USAGE_ID + '-form',
        CANCEL_BUTTON: '.cancel-button',
        SUMMATIVE_CHECKBOX: '.summative',
        SELECTED_LAYOUT: '.layout-options',
        SHOW_LINK_BTN: '#show_link_button',
        TEXT_AREA: 'textarea[name="editor"]',
        ADD_SLIDE_BUTTON: '.add-slide-button',
        INPUT_TEMPLATE: 'script[type="text/html"][data-name="input-template"]',
    }

    _EdlyCarouselEditBlock.VIEW = {
        LAST_PAGE: $(_EdlyCarouselEditBlock.SELECTOR.LAST_PAGE, element),
        START_PAGE: $(_EdlyCarouselEditBlock.SELECTOR.START_PAGE, element),
        DIV_ATTEMPTS: $(_EdlyCarouselEditBlock.SELECTOR.DIV_ATTEMPTS, element),
        MAX_ATTEMPTS: $(_EdlyCarouselEditBlock.SELECTOR.MAX_ATTEMPTS, element),
        LINK_OPTIONS: $(_EdlyCarouselEditBlock.SELECTOR.LINK_OPTIONS, element),
        CANCEL_BUTTON: $(_EdlyCarouselEditBlock.SELECTOR.CANCEL_BUTTON, element),
        SHOW_LINK_BTN: $(_EdlyCarouselEditBlock.SELECTOR.SHOW_LINK_BTN, element),
        INPUT_TEMPLATE: $(_EdlyCarouselEditBlock.SELECTOR.INPUT_TEMPLATE, element),
        SELECTED_LAYOUT: $(_EdlyCarouselEditBlock.SELECTOR.SELECTED_LAYOUT, element),
        ADD_SLIDE_BUTTON: $(_EdlyCarouselEditBlock.SELECTOR.ADD_SLIDE_BUTTON, element),
        EDIT_FORM: $(document.getElementById(_EdlyCarouselEditBlock.SELECTOR.EDIT_FORM)),
        INPUT_LIST: $(document.getElementById(_EdlyCarouselEditBlock.SELECTOR.INPUT_LIST)),
        SUMMATIVE_CHECKBOX: $(_EdlyCarouselEditBlock.SELECTOR.SUMMATIVE_CHECKBOX, element),
    }

    _EdlyCarouselEditBlock.VIEW['START_PAGE_EDITOR'] = CodeMirror.fromTextArea(_EdlyCarouselEditBlock.VIEW.START_PAGE[0], { mode: 'xml', htmlMode: true, lineWrapping: true })
    _EdlyCarouselEditBlock.VIEW['LAST_PAGE_EDITOR'] = CodeMirror.fromTextArea(_EdlyCarouselEditBlock.VIEW.LAST_PAGE[0], { mode: 'xml', htmlMode: true, lineWrapping: true })

    $(function () {

        $(_EdlyCarouselEditBlock.VIEW.ADD_SLIDE_BUTTON).click(function (e) {
            e.preventDefault();
            _EdlyCarouselEditBlock.slideInputComponent(_EdlyCarouselEditBlock.VIEW.INPUT_LIST);
        });

        $(_EdlyCarouselEditBlock.VIEW.EDIT_FORM).submit(function (e) {
            e.preventDefault();
            _EdlyCarouselEditBlock.submit(this);
        });

        $(_EdlyCarouselEditBlock.VIEW.SHOW_LINK_BTN).change(function (e) {
            e.preventDefault();
            _EdlyCarouselEditBlock.handleCheckboxClick(e.target);
        });

        $(_EdlyCarouselEditBlock.VIEW.CANCEL_BUTTON).click(function (e) {
            e.preventDefault();
            _EdlyCarouselEditBlock.cancel(this);
        });

        $(_EdlyCarouselEditBlock.VIEW.SUMMATIVE_CHECKBOX).click(function (e) {
            _EdlyCarouselEditBlock.updateAttempsUI(e.target);
        });

        _EdlyCarouselEditBlock.updateView(function (result) {
            result.forEach(function (item, index) {
                _EdlyCarouselEditBlock.slideInputComponent(_EdlyCarouselEditBlock.VIEW.INPUT_LIST, item);
            });
        });
    });
}

EdlyCarouselEditBlock.prototype.handleCheckboxClick = function(target) {
    _EdlyCarouselEditBlock = this;
    target.checked ? $(_EdlyCarouselEditBlock.VIEW.LINK_OPTIONS).removeClass('hide') : $(_EdlyCarouselEditBlock.VIEW.LINK_OPTIONS).addClass('hide')
}

EdlyCarouselEditBlock.prototype.updateAttempsUI = function(target) {
    _EdlyCarouselEditBlock = this;
    var attemptsDiv = _EdlyCarouselEditBlock.VIEW.DIV_ATTEMPTS
    target.checked ? $(attemptsDiv).show() : $(attemptsDiv).hide()
}

EdlyCarouselEditBlock.prototype.deleteSlide = function(param, target) {
    _EdlyCarouselEditBlock = target;
    $(param.target).closest('li.field.comp-setting-entry.is-set').remove();
    delete _EdlyCarouselEditBlock.editors[$(param.target).attr("data-id")]
}

EdlyCarouselEditBlock.prototype.getCodeMirror = function(INPUT_TEMPLATE) {
    var _EdlyCarouselEditBlock = this;
    var xmlEditorTextarea = $(_EdlyCarouselEditBlock.SELECTOR.TEXT_AREA, INPUT_TEMPLATE),
    xmlEditor = CodeMirror.fromTextArea(xmlEditorTextarea[0], { mode: 'xml', htmlMode: true, lineWrapping: true });
    return xmlEditor;
}

EdlyCarouselEditBlock.prototype.insertCodeSnippet = function(event, target, templateID) {
    _EdlyCarouselEditBlock = target;
    var code = $(templateID).text();
    var editor = _EdlyCarouselEditBlock.editors[$(event.target).attr("data-id")]
    editor.setValue(editor.getValue() + code);
}

EdlyCarouselEditBlock.prototype.registerButtonEvent = function(selector, templateID, params) {
    var _EdlyCarouselEditBlock = this;
    var callback = params['callback']
    $(selector, params['inputTemplate']).attr("data-id", params['elementID']).click(
            function(e){callback(e, _EdlyCarouselEditBlock, templateID)
    })
}

EdlyCarouselEditBlock.prototype.registerButtonEvents = function(INPUT_TEMPLATE, elementID) {
    var _EdlyCarouselEditBlock = this;
    var params = {'inputTemplate': INPUT_TEMPLATE, 'elementID': elementID,
                  'callback': _EdlyCarouselEditBlock.insertCodeSnippet
                  }
    var selectorAndSnippets = {
        '.add-image': 'script[type="text/html"][data-name="input-img-template"]',
        '.add-audio': 'script[type="text/html"][data-name="input-audio-template"]',
        '.add-paragraph': 'script[type="text/html"][data-name="input-para-template"]',
        '.wistia-video': 'script[type="text/html"][data-name="input-wistia-template"]',
        '.survey-mcq': 'script[type="text/html"][data-name="input-survey-mcq-template"]',
        '.survey-mrq': 'script[type="text/html"][data-name="input-survey-mrq-template"]',
        '.summative-mcq': 'script[type="text/html"][data-name="input-summative-mcq-template"]',
        '.summative-mrq': 'script[type="text/html"][data-name="input-summative-mrq-template"]',
        '.formative-mcq': 'script[type="text/html"][data-name="input-formative-mcq-template"]',
        '.formative-mrq': 'script[type="text/html"][data-name="input-formative-mrq-template"]',
        '.formative-mcq-resp': 'script[type="text/html"][data-name="input-formative-mcq-resp-template"]',
        '.formative-mrq-resp': 'script[type="text/html"][data-name="input-formative-mrq-resp-template"]',
        '.summative-mcq-resp': 'script[type="text/html"][data-name="input-summative-mcq-resp-template"]',
        '.summative-mrq-resp': 'script[type="text/html"][data-name="input-summative-mrq-resp-template"]',
    }
    for (const [ selector, templateID ] of Object.entries(selectorAndSnippets)) {
        _EdlyCarouselEditBlock.registerButtonEvent(selector, templateID, params)
    }
    params['callback'] = _EdlyCarouselEditBlock.deleteSlide;
    _EdlyCarouselEditBlock.registerButtonEvent(_EdlyCarouselEditBlock.SELECTOR.DELETE_BUTTON, null, params)
}

EdlyCarouselEditBlock.prototype.slideInputComponent = function (element, data) {
    var _EdlyCarouselEditBlock = this;
    var INPUT_TEMPLATE = $($(_EdlyCarouselEditBlock.VIEW.INPUT_TEMPLATE).text());
    var timestamp = new Date().getMilliseconds() + Math.random();
    var elementID = timestamp.toString().replace(".", "")
    INPUT_TEMPLATE.attr('id', elementID);
    var xmlEditor = _EdlyCarouselEditBlock.getCodeMirror(INPUT_TEMPLATE)
    $(_EdlyCarouselEditBlock.SELECTOR.DELETE_BUTTON, INPUT_TEMPLATE).attr("data-id", elementID)
    _EdlyCarouselEditBlock.registerButtonEvents(INPUT_TEMPLATE, elementID);
    _EdlyCarouselEditBlock.editors[elementID] = xmlEditor
    element.append(INPUT_TEMPLATE);
    if (data) {
        xmlEditor.setValue(data);
    }
}

EdlyCarouselEditBlock.prototype.cancel = function (element) {
    var _EdlyCarouselEditBlock = this;
    _EdlyCarouselEditBlock.runtime.notify('cancel', {});
}

EdlyCarouselEditBlock.prototype.submit = function (form) {
    var _EdlyCarouselEditBlock = this;
    var payload = _EdlyCarouselEditBlock.toJSON(form);
    _EdlyCarouselEditBlock.runtime.notify("save", {state: 'start', message: 'saving'})
    _EdlyCarouselEditBlock.post(_EdlyCarouselEditBlock.URL.SAVE, payload, function(response){
        if (response.result === 'success') {
            _EdlyCarouselEditBlock.runtime.notify('save', {state: 'end'});
        } else if (response.result === 'error') {
            _EdlyCarouselEditBlock.runtime.notify("error", {"title": "Error saving data",
                            "message": response.message});
        }
    });
}

EdlyCarouselEditBlock.prototype.toJSON = function (form) {

    var serializedArray = $(form).serializeArray(), data = {};
    $.each(serializedArray, function (index, item) {
        data[item.name] = item.value;
    });
    var _EdlyCarouselEditBlock = this, pages = [];
    var editors = _EdlyCarouselEditBlock.editors
    var assessments = 0;
    var summativeAssessments = 0;
    var assessmentDiv = '<div class="assessment-container"'
    var summativeAssignmentDiv = 'data-type="summative"'
    for (var key in editors) {
        // check if the property/key is defined in the object itself, not in parent
        if (editors.hasOwnProperty(key)) {
            var slideValue = editors[key].getValue().trim();
            if (slideValue !== "") {
                assessments += slideValue.includes(assessmentDiv) ? 1 : 0
                summativeAssessments += slideValue.includes(summativeAssignmentDiv) ? 1 : 0
                pages.push(slideValue);
            }
        }
    }

    data['slides'] = pages
    data['is_summative'] = summativeAssessments > 0
    // Summative assessments
    data['summative_assessments'] = summativeAssessments > 0 ? summativeAssessments : 1
    data['total_assessments'] = assessments

    return data
}

EdlyCarouselEditBlock.prototype.post = function(url, payload, callback) {
    $.post(url, JSON.stringify(payload))
    .done(function( response ) {
        if (callback) {
            callback(response);
        }
    });
}

EdlyCarouselEditBlock.prototype.updateView = function (callback) {
    var _EdlyCarouselEditBlock = this;

    $.get(_EdlyCarouselEditBlock.URL.GET_SLIDES, function (result) {
        if (callback) {
            callback(result);
        }
    });
}
