
//Determine application name from the current URL
function getApplicationName(){
    var url = window.location.href;
    var pieces = url.split('/');
    var index = 0;
    var appName;
    for(var ii=0; ii < pieces.length; ii++) {
        //Ignore http[s]://
        if (pieces[ii].indexOf('http') == 0 || pieces[ii].length == 0)
            continue;

        index++;

        if(index == 1)  //server/host/domain
            continue;

        if(index == 2){ //application name
            appName = pieces[ii];
            break;
        }
    }
    return appName;
}


var generic_url;
var ctrl = "XXCTLXX";
var actn = "XXACTXX";
function getUrl(controller, action){
    var tmp = generic_url;
    if(typeof tmp === 'undefined'){
        //In case generic_url never gets defined
        tmp = '/'+getApplicationName()+'/'+ctrl+'/'+actn;
    }
    tmp = tmp.replace(ctrl,controller);
    tmp = tmp.replace(actn,action);
    return tmp;
}

//Set timeout for flash message auto-hiding
msgTimeoutID = window.setTimeout(function(){hideMessages()}, 3000);

//Functions to run at every page load
$(document).ready(function(){
    pageCompletionTasks();
});

//Functions to run after every AJAX request
$(document).ajaxComplete(function(e, xhr, settings) {
    //some ajax calls can get stuck in a loop if the updatepagedetails function 
    //is called after complete... Like flash_messages().
    if (!settings.bypassGlobalComplete){
        requestCompletionTasks();
    }
});


/** requestCompletionTasks()
 *
 *  Statements that should run upon completion of ALL requests
 *  (AJAX or full-page loads)
 *
 */
function requestCompletionTasks(){
    //Session counter
    createCounter('session', 30, 0, 'down',
        function(){
            psuAlert('You may need to refresh your page, or some functionality may fail.', 'Inactivity Timeout!')
        }
    );
    startCounter('session');

    //Display any messages generated during request
    flash_messages();

    //Any element with a screen-reader description and no title
    $("[aria-label]").not("[title]").each(function(index, element){
        var txt = $(element).attr('aria-label');
        $(element).attr('title', txt);
    });
    //Any element with a title and no screen-reader description
    $("[title]").not("[aria-label]").not("[aria-hidden]").each(function(index, element){
        var txt = $(element).attr('title');
        $(element).attr('aria-label', txt);
    });
    //Any element with an onclick action and no cursor defined
    $("[onclick]").each(function(index, element){
        if($(element).css("cursor") === "auto"){
            $(element).css("cursor", "pointer");
        }
    });

    //Any link that leaves the application should open in a new window
    externalLinks();

    // Apply chosen to select lists
    applyChosenStyle();

    //Apply "dotted" style to tables with appropriate class
    dottedTables();
    dottedColumns();

    // Add select/deselect all toggle to optgroups in chosen
    $(document).on('click', '.group-result', function() {
        // Get unselected items in this group
        var unselected = $(this).nextUntil('.group-result').not('.result-selected');
        if(unselected.length) {
            // Select all items in this group
            unselected.trigger('mouseup');
        } else {
            $(this).nextUntil('.group-result').each(function() {
                // Deselect all items in this group
                $('a.search-choice-close[data-option-array-index="' + $(this).data('option-array-index') + '"]').trigger('click');
            });
        }
    });

    //Inject column sorting icons into the table column(s) that are sorted.
    $('th.sorted.asc a').add('span.sorted.asc a').each(function() {
        //only add icon if the element doesn't already have one.
        if($(this).children("i").length < 1){
            $(this).append(" <i class=\"glyphicon glyphicon-triangle-top\" title=\"sorted ascending\" aria-label=\"sorted ascending\"></i>");
        }
    });
    $('th.sorted.desc a').add('span.sorted.desc a').each(function() {
        //only add icon if the element doesn't already have one.
        if($(this).children("i").length < 1){
            $(this).append(" <i class=\"glyphicon glyphicon-triangle-bottom\" title=\"sorted descending\" aria-label=\"sorted descending\"></i>");
        }
    });

    //Add a note icon to any note-box content
    var noteBoxes = $(".note-box");
    noteBoxes.find(".fa-file-text-o").remove();
    noteBoxes.prepend('<i class="fa fa-file-text-o" style="color:cornflowerblue;margin-right:15px;"></i>');

    //Initialize edit icons for any WYSIWYG text
    initializeInlineEditIcons();

    //Initialize tool-tips
    $('[data-toggle="tooltip"]').tooltip();
}


/** pageCompletionTasks()
 *
 *  Statements that should run upon completion of ALL pages
 *  (Not including AJAX requests)
 *
 */
function pageCompletionTasks(){
    //All request completion tasks happen at page load too
    requestCompletionTasks();

    //Focus on any element given the initial-focus class
    $('.initial-focus').focus();

    //Validate required fields on any forms
    //This will be replaced by any onsubmit attributes added to the form
    //(So, custom validation functions should also call checkRequiredInputs)
    $("form").each(function(){
        $(this).submit(function(){
            return checkRequiredInputs($(this));
        });
    });


}


/** flash_messages()
 *
 *  Gets messages (error, warning, debug, success) from the session and
 *  posts them as alerts in the message console
 */
function flash_messages(){
    var url_str = getUrl("utility", "flashMessages");
    $.ajax({
        bypassGlobalComplete: true,
        type:   "GET",
        url:    url_str,
        data:   { ts: new Date().getTime() },
        beforeSend:function(){

        },
        success:function(data){
            $("#flash-message-container").append(data);
            prependFlashMessageIcons();
            hideMessages();
        },
        error:function(){
        },
        complete:function(){

        }
    });

}

function prependFlashMessageIcons(){

    //Prepend fa icons for visual effect
    $("#flash-message-container").find(".alert").each(function() {

        //If no icons are already present
        if ($(this).find('.fa').add($(this).find('.glyphicon')).length == 0) {
            var fa = '<span class="fa fa-';
            if ($(this).hasClass('alert-danger')) {
                fa += 'exclamation-triangle';
            }
            else if ($(this).hasClass('alert-warning')) {
                fa += 'bell-o';
            }
            else if ($(this).hasClass('alert-info')) {
                fa += 'info-circle';
            }
            else if ($(this).hasClass('alert-success')) {
                fa += 'smile-o';
            }
            fa += '"></span>&nbsp;';
            $(this).prepend(fa);
        }
    });
}

/** hideMessages()
 *
 * Hide flash messages (messages fixed at top of screen)
 */
var flashSeq = 0;
function hideMessages(){
    var msgContainer = $("#flash-message-container");
    var numSeconds = 0;
    var offset = 1;
    var offset_warn = 0;
    var offset_info = 0;

    msgContainer.find(".alert").each(function(){

        //If a timeout was already set, ignore this message
        if($(this).attr('timeout-set')){
            return true;
        }

        //Do not auto-hide errors
        if($(this).hasClass('alert-danger')){
            return true;
        }

        //Warnings auto-hide after 20 seconds
        if($(this).hasClass('alert-warning')){
            numSeconds = 20 + offset_warn;
            offset_warn += offset;
        }
        //Hide info/success after 10 seconds
        else{
            numSeconds = 10 + offset_info;
            offset_info += offset;
        }

        var identifier = $(this).attr('id');
        if(typeof identifier === 'undefined' || identifier == 'undefined'){
            identifier = 'flashMsg-' + flashSeq;
            $(this).attr('id', identifier);
        }

        setTimeout((function() { $("#"+identifier).fadeOut(400); }), (numSeconds*1000));
        $(this).attr('timeout-set', true);

        flashSeq++;
    });
}


/** post_message()
 *
 *  Posts a message for displaying in the flash messages section
 *
 *  Parameters:
 *      1. The message
 *      2. Type of message (error, warning, info, success, debug)
 *      3. [Optional] Call flash messages() after posting?  default: False
 */
function post_message(msg, type, callFlashMessages){
    //By default, do not immediately call flash messages
    if(typeof callFlashMessages === 'undefined'){
        callFlashMessages = false;
    }

    var url_str = getUrl("utility", "postMessage");
    $.ajax({
        bypassGlobalComplete: callFlashMessages,
        type:   "POST",
        url:    url_str,
        data:   { message: msg, type: type },
        beforeSend:function(){ },
        success:function(data){ },
        //On failure, alert the error message in a JS alert
        error:function(){
            if(type === "error"){
                //Make sure error message gets seen
                psuAlert(msg, 'Error');
            }
        },
        complete:function(){ }
    });

}


/** setProxy()
 *
 * Allow user to pretend to be someone else
 */
function setProxy(){
    var url_str = getUrl("task", "addFile");
    var panelHeading = $("#file-panel-heading");
    var panelInput = $("#file-panel-input");
    var fileInfo = panelInput.val();

    if(typeof fileInfo === "undefined"){
        //If the input does not exist, refresh the file view
        fileInfo = "REFRESH"
    }

    $.ajax({
        type:   "POST",
        url:    url_str,
        data:   { taskId: taskId, fileInfo: fileInfo},
        beforeSend:function(){
            panelInput.removeClass("ajax-error");
            panelHeading.append(getAjaxLoadImage());
        },
        success:function(fileContainerHTML){
            $("#file-panel-container").html(fileContainerHTML);
        },
        error:function(ee){
            panelInput.addClass("ajax-error");
        },
        complete:function(){
            clearAjaxLoadImage(panelHeading.attr("id"));
        }
    });
}

function checkRequiredInputs(formElement){
    var numErrors = 0;

    if(typeof formElement === 'undefined'){
        formElement = $('form');
    }

    //For each label with an asterisk in it (meaning it's required)
    formElement.find("label:contains('*')").not(":hidden").each(function(){
        //Gather some info
        var reqLabelTxt = $(this).html();       //Label text
        var reqInputId = $(this).attr('for');   //Input ID
        var reqInput = $("#"+reqInputId);       //Input

        //Required input label with no for attribute
        //This should be caught and fixed during development
        if (typeof reqInput.attr('id') === "undefined") {
            $(this).css('border-bottom', '3px dotted orangered');
        }

        //If select menu
        else if(reqInput.prop('tagName') === "SELECT") {
            //If selected option is NULL
            if (reqInput.find(":selected").val().trim() === "") {
                numErrors++;

                //For standard select menu
                reqInput.addClass("ajax-error");
                reqInput.change(function () {
                    $(this).removeClass('ajax-error');
                });

                //for chosen select menu
                if(reqInput.hasClass("chosen-select")) {
                    reqInput.parent().find(".chosen-container-active").add(".chosen-single").addClass('ajax-error');
                    reqInput.change(function () {
                        $(this).parent().find(".chosen-container-active").add(".chosen-single").removeClass('ajax-error');
                    });
                }
            }
        }

        //All other input types
        else {
            try{
                //If current value is NULL
                if (reqInput.val().trim() === "") {
                    numErrors++;
                    reqInput.addClass("ajax-error");
                    reqInput.change(function () {
                        $(this).removeClass('ajax-error');
                    });
                }
            }
            catch(ee){}
        }
    });

    if(numErrors === 0){
        return true;
    }
    else{
        psuAlert(numErrors + " required fields have been left blank.", 'Missing Required Fields');
        clearAjaxLoadImage();
        return false;
    }

}

function hideLog(){
    $('#log-console').addClass('hidden');
    $('#log-button').removeClass('hidden');
}

function showLog(){
    $('#log-console').removeClass('hidden');
    $('#log-button').addClass('hidden');

    //Remove any posted debug message (since they're also in the log)
    $(".debug").each(function(){
        if($(this).hasClass("alert-dismissible")){
            $(this).remove();
        }
    });
}

function setDebugMode(on_off){
    document.location.href="?debugMode="+on_off;
}
function setInlineEditMode(on_off){
    document.location.href="?inlineEditMode="+on_off;
}


function hoverInfotext(elementId, objectId){
    var container = $("#"+elementId)
    var tooltip = container.find(".editable-text-tooltip");
    var content = container.find(".editable-text-content");
    content.addClass("editable-text-hover");
    tooltip.removeClass("hidden");
}

function unhoverInfotext(elementId){
    var container = $("#"+elementId)
    var tooltip = container.find(".editable-text-tooltip");
    var content = container.find(".editable-text-content");
    content.removeClass("editable-text-hover");
    tooltip.addClass("hidden");
}

function mouseoutInfotext(elementId){
    dtTimeout = window.setTimeout(function(){unhoverInfotext(elementId)}, 500);
}


function saveInfotext(elementId, objectId){
    var url_str = getUrl("infotext", "updateInfotext");

    var container = $("#"+elementId)
    var content = container.html();
    container.removeClass("ajax-error");

    $.ajax({
        type:   "POST",
        url:    url_str,
        data:   { infotextId: objectId, content: content},
        beforeSend:function(){
            container.addClass("ajax-pending");
            container.before(getAjaxLoadImage());
        },
        success:function(fileContainerHTML){
            container.removeClass("ajax-pending");
            container.find(".editable-text-content").html(fileContainerHTML);
            container.addClass("ajax-success");
            dtsTimeout = window.setTimeout(function(){container.removeClass("ajax-success");}, 1000);
        },
        error:function(ee){
            container.addClass("ajax-error");
        },
        complete:function(){
            clearAjaxLoadImage(container.closest('.editable-text').attr("id"));
            container.removeClass("ajax-pending");
        }
    });
}


/** displayInfotext()
 *
 * Lookup text and put it into an element on the page
 *
 * @param {String} textCode: Infotext.code
 * @param {String} destinationId: HTML id of element to display text in
 * @param {type} destinationType: html [default] or val (jQuery function needed to display text in element)
 * @returns {undefined}
 */
function displayInfotext(textCode, destinationId, destinationType){
    var url_str = getUrl("infotext", "getInfotext");

    $.ajax({
        type:   "GET",
        url:    url_str,
        data:   { infotextCode: textCode, ts: new Date().getTime()},
        beforeSend:function(){},
        success:function(infotext){
            var destination = $("#"+destinationId);
            if(typeof destinationType === "undefined" || destinationType === "html"){
                destination.html(infotext);
            }
            else{
                destination.val(infotext);
            }
        },
        error:function(ee){},
        complete:function(){}
    });
}

/** addOptionToSelect()
 *
 * Add a new option to a select menu, and select it
 *
 * @param {String} menuId: HTML id of the select menu
 * @param {String} newValue: (optional) Value to add. Will prompt for value by default
 * @param {type} newLabel: (optional) Label for new value. Will use value as label by default
 * @returns {undefined}
 */
function addOptionToSelect(menuId, newValue, newLabel){
    var selectMenu = $("#"+menuId);

    //If new value was not given
    if(typeof newValue === "undefined"){
        //Message could come from one of three places:
        var defaultMsg = "New Value:";
        var menuName = selectMenu.prop("name");
        var providedMsg = selectMenu.attr("promptText");

        //Select one of the three potential messages
        var promptText = defaultMsg;
        if(menuName){
            promptText = menuName + ":"
        }
        if(providedMsg){
            promptText = providedMsg;
        }

        //Prompt for the new value
        newValue = prompt(promptText);
    }

    //Add the new value to the list
    selectMenu.append('<option value="'+newValue+'">'+newValue+'</option>');

    //Select the new value
    selectMenu.find('option[value="'+newValue+'"]').attr("selected", true);

    //update chosen select (if applicable)
    if(selectMenu.hasClass("chosen-select")){
        selectMenu.trigger("chosen:updated");
    }
}

function permissionMenuNotes(){
    var descContainer = $('#iicc');
    var menu = $("#code");
    var selectedCode = menu.val();
    var selectedDesc = $("#ii-" + selectedCode).html();
    descContainer.html(selectedDesc);
}

/** checkInputLabels **
 *
 * ONLY CALL THIS FROM NON-PRODUCTION
 *
 */
function checkInputLabels(){
    var inputs = $('input').add('select').add('textarea');  //.add('button')
    var numMissingLabels = 0;
    var listMissingLabels = ""

    inputs.each(function(){

        //ignore hidden inputs
        if( $(this).prop('tagName').toUpperCase() === "INPUT" ){
            if( $(this).attr('type').toUpperCase() === "HIDDEN" ){
                return true;
            }
        }

        //Look for a label
        var label = $("label[for='"+$(this).attr('id')+"']");
        if (label.length == 0) {
            label = $(this).closest('label');
        }

        //if label was not found
        if (label.length == 0) {
            $(this).css('border', '3px solid Red');
            numMissingLabels++;
            if(typeof $(this).attr('name') !== 'undefined' && $(this).attr('name').trim() !== "") {
                listMissingLabels += "\t" + $(this).attr('name') + "\n";
            }
            else if(typeof $(this).attr('id') !== 'undefined' && $(this).attr('id').trim() !== "") {
                listMissingLabels += "\t" + $(this).attr('id') + "\n";
            }
            else if(typeof $(this).text() !== 'undefined' && $(this).text().trim() !== "") {
                listMissingLabels += "\t" + $(this).text().trim() + "\n";
            }
            else if(typeof $(this).html() !== 'undefined' && $(this).html().trim() !== "") {
                listMissingLabels += "\t" + $(this).html().trim() + "\n";
            }
            else{
                //Nothing useful in this input, ignore it
                numMissingLabels--;
            }
        }
    });

    //If missing labels, alert user (this should only run in non-production)
    //Enable/disable this by changing the hard-coded boolean below
    if(false && numMissingLabels > 0){
        psuAlert("There are "+numMissingLabels+" inputs missing labels on this page:\n"+listMissingLabels, 'Development Alert');
    }
}

//inputElement is required, others are optional
function validateDate(inputId, format, minDate, maxDate){
    var url_str = getUrl("utility", "validateDate");

    var inputElement = $("#"+inputId);
    var dateString = inputElement.val();

    //Get name and ID of input
    var inputId = inputElement.attr("id");

    //ID of container for any date validation error
    var errorContainerId = inputId + "-dtValError";

    //Look for page-level min and max dates
    if(typeof minDate === 'undefined' || minDate == ""){
        minDate = $("#minDate").val();
    }
    if(typeof maxDate === 'undefined' || maxDate == ""){
        maxDate = $("#maxDate").val();
    }

    //Remove any previous ajax status classes or error messages
    inputElement.removeClass("ajax-pending");
    inputElement.removeClass("ajax-success");
    inputElement.removeClass("ajax-error");
    $("#"+errorContainerId).remove();

    $.ajax({
        dataType: "json",
        type:   "POST",
        url:    url_str,
        data:   { dateString: dateString, dateFormat: format, minDate: minDate, maxDate:maxDate },
        beforeSend:function(){
            inputElement.addClass("ajax-pending");
        },
        success:function(responseObject){
            inputElement.removeClass("ajax-pending");

            if(responseObject["response"] == 'valid'){
                inputElement.val(responseObject["date"]);
            }
            else if(responseObject["response"] == null){
                //Blank dates are OK.
                //Null handling should catch required dates left blank
            }
            else{
                inputElement.addClass("ajax-error");
                var errorMessage = '<span class="xsm dtValError" style="color:Red;" id="'+errorContainerId+'">';
                errorMessage += responseObject["error"]
                errorMessage += "</span>";
                inputElement.after(errorMessage);
                inputElement.val("");
            }

        },
        error:function(ee){
            inputElement.addClass("ajax-error");
        }
    });
}

/** Timers/Counters **/
var counters = {}
function createCounter(counterName, minutes, seconds, direction, timerAction, speedMultiplier){
    //If counter already exists, do not overwrite it.  Reset it instead.
    if(counterName in counters){
        resetCounter(counterName, minutes, seconds);
        return true;
    }

    //For speeding up timer (to count time in increments less than 1 second)
    //Ex. speedMultiplier of 2 == 1/2 second iterations
    if(typeof speedMultiplier === 'undefined'){
        speedMultiplier = 1;
    }

    //Create a new counter
    counters[counterName] = {
        defaultMinutes: minutes, defaultSeconds: seconds,
        direction: direction, speedMultiplier: speedMultiplier,
        action:function(){ timerAction(); },
        minutes: undefined, seconds: undefined, interval: undefined, initialized: false
    };
}
function startCounter(counterName, minutes, seconds){
    try {
        //Set counter to specified or default time
        resetCounter(counterName, minutes, seconds);

        //If counter is already running, do not start it again
        if(counters[counterName]['initialized']){
            return true;
        }

        //Start the timer
        counters[counterName]['interval'] = setInterval(function(){touchCounter(counterName)}, 1000/counters[counterName]['speedMultiplier']);
        counters[counterName]['initialized'] = true;
    }
    catch(ee){ }

}
function pauseCounter(counterName){
    try{
        clearInterval(counters[counterName]['interval']);
    }
    catch(ee){ }
}
function resumeCounter(counterName){
    try{
        counters[counterName]['interval'] = setInterval(function(){touchCounter(counterName)}, 1000/counters[counterName]['speedMultiplier']);
    }
    catch(ee){ }
}
function resetCounter(counterName, minutes, seconds){
    try{
        if(counters[counterName]['direction'] == 'down') {

            //If reset time not specified, use default
            if (typeof minutes === 'undefined') {
                minutes = counters[counterName]['defaultMinutes'];
            }
            if (typeof seconds === 'undefined') {
                seconds = counters[counterName]['defaultSeconds'];
            }
        }
        else{
            //If reset time not specified, reset to zero
            if (typeof minutes === 'undefined') {
                minutes = 0;
            }
            if (typeof seconds === 'undefined') {
                seconds = 0;
            }
        }

        //Reset counter
        counters[counterName]['minutes'] = minutes;
        counters[counterName]['seconds'] = seconds;
    }
    catch(ee){}
}
function touchCounter(counterName){
    try{
        var mm = counters[counterName]['minutes'];
        var ss = counters[counterName]['seconds'];

        //If counting down
        if(counters[counterName]['direction'] == 'down') {

            //If counter is done counting
            if (mm + ss == 0) {
                //Interval should have already been cleared, but clear again, just to be safe
                try{
                    clearInterval(counters[counterName]['interval']);
                }
                catch(ee){}
                return
            }

            //If reducing minutes
            if (ss == 0 && mm > 0) {
                mm -= 1;
                ss = 60;
            }
            //If reducing seconds
            if (ss > 0) {
                ss -= 1;
            }

            //Stop the counter at 0:00, and call the defined action
            if (mm + ss == 0) {

                //Make sure counter is set to 0:00
                counters[counterName]['minutes'] = 0;
                counters[counterName]['seconds'] = 0;

                //Stop the timer
                clearInterval(counters[counterName]['interval']);
                //Call the action
                try {
                    counters[counterName]['action']();
                }
                catch(ee){}
            }
        }

        //If counting up
        else{
            ss += 1;
            if(ss == 60){
                mm += 1;
                ss = 0;
            }

            //Stop the counter at its limit, and call the defined action
            if (mm == counters[counterName]['defaultMinutes'] && ss == counters[counterName]['defaultSeconds']) {

                //Make sure counter is set to stop time
                counters[counterName]['minutes'] = mm;
                counters[counterName]['seconds'] = ss;

                //Stop the timer
                clearInterval(counters[counterName]['interval']);
                //Call the action
                try {
                    counters[counterName]['action']();
                }
                catch(ee){}
            }
        }

        counters[counterName]['minutes'] = mm;
        counters[counterName]['seconds'] = ss;

        //seconds as two-digit string
        var ssStr = ('00' + ss).substr(-2);
        var timeStr = mm + ":" + ssStr;

        //Update any containers with conventional ids
        $("#counterMin-"+counterName).val(mm);
        $("#counterSec-"+counterName).val(ssStr);
        $("#counterVal-"+counterName).val(timeStr);
        $("#counterHtml-"+counterName).html(timeStr);
    }
    catch(ee){}
}


function setPreference(code, value){

    var url_str = getUrl("preference", "setPreference");
    var assumedInput = $("#pref-"+code);

    //Value will not be given when called from preference list
    if(typeof value === 'undefined'){
        value = assumedInput.val();
    }

    $.ajax({
        type:   "POST",
        url:    url_str,
        data:   { preferenceCode: code, preferenceValue: value },
        beforeSend:function(){
            clearAjaxSaveIcon(assumedInput.parent());
            assumedInput.after(getAjaxLoadImage());
        },
        success:function(result){
            assumedInput.after(getAjaxSavedIcon());
            assumedInput.val(result);
        },
        error:function(ee){
            assumedInput.after(getAjaxSaveFailedIcon(ee));
        },
        complete:function(){clearAjaxLoadImage(assumedInput.parent());}
    });
}


function getSelectionText() {
    //http://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
    var text = "";
    try {
        if (window.getSelection) {
            text = window.getSelection().toString();
        }
        else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }
    }
    catch(ee){}
    return text;
}

function dottedColumns(){
    var tables = $("table.dotted-columns");
    tables.find('td').css("border-right", '1px dotted #777');
    tables.find('th').css("border-right", '1px dotted #777');
    tables.find("tr td:last-child").css("border-right", '0px');
}

function dottedTables(){
    var tables = $("table.dotted").css('border', '0px');
    tables.find('td').css("border-right", '1px dotted #777').css("border-bottom", '1px dotted #777');
    tables.find("tr td:last-child").css("border-right", '0px');
}

function externalLinks(){
    //Any link that leaves the application should open in a new window
    $("a").each(function(){
        try {
            //If a target is defined, use it
            if ($(this).attr('target')) {
                return true;
            }

            //If link has no href, ignore it
            else if (typeof $(this).attr('href') === 'undefined') {
                return true;
            }

            //If link is to a bookmark on the page, ignore it
            else if ($(this).attr('href').indexOf('#') == 0) {
                return true;
            }

            //If link is a relative path, do not modify
            else if ($(this).attr('href').indexOf('/') == 0) {
                return true;
            }

            //If app name is in URL, it's probably an internal link
            else if ($(this).attr('href').indexOf('/' + getApplicationName() + '/') > -1) {
                return true;
            }

            //Must be an external link
            else {
                //make link open in a new tab
                $(this).attr('target', '_blank');

                //Do not add icon to header link menu
                if($(this).parent().parent().attr('id') == 'utility-nav-parent') {
                    return true;
                }

                //Do not add icon to copyright link
                if($(this).parent().hasClass('placemat')) {
                    return true;
                }

                //Add an external link icon (unless in template header links)
                if ($(this).find('.fa-external-link').length == 0) {
                    $(this).append('<sup style="color:Blue;"> <i class="fa fa-external-link xsm" aria-label="opens in a new window" title="opens in a new window"></i></sup>');
                }
            }

        }
        catch(ee){}
    });
}


function lookupUser(userInfo, callback){

    var url_str = getUrl("utility", "lookupUser");

    $.ajax({
        type:   "GET",
        url:    url_str,
        data:   { userInfo: userInfo },
        beforeSend:function(){
        },
        success:function(result){
            callback(result);
        },
        error:function(ee){

        },
        complete:function(){}
    });
}
