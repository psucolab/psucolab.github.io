if (typeof jQuery !== 'undefined') {
    (function($) {
        $('#spinner').ajaxStart(function() {
            $(this).fadeIn();
        }).ajaxStop(function() {
            $(this).fadeOut();
        });
    })(jQuery);
}

//Default settings for alert boxes
//http://craftpip.github.io/jquery-confirm
jconfirm.defaults = {
    title: false,
    content: 'Are you sure?',
    contentLoaded: function(){},
    icon: '',
    confirmButton: 'Okay',
    cancelButton: 'Close',
    confirmButtonClass: 'btn-default',
    cancelButtonClass: 'btn-default',
    theme: 'white',
    animation: 'zoom',
    closeAnimation: 'scale',
    animationSpeed: 50,
    animationBounce: 1.2,
    keyboardEnabled: true,
    rtl: false,
    confirmKeys: [13], // ENTER key
    cancelKeys: [27], // ESC key
    container: 'body',
    confirm: function () {},
    cancel: function () {},
    backgroundDismiss: false,
    autoClose: false,
    closeIcon: null,
    columnClass: 'col-md-4 col-md-offset-4 col-sm-6 col-sm-offset-3 col-xs-10 col-xs-offset-1',
    onOpen: function(){},
    onClose: function(){},
    onAction: function(){}
};


/** applyChosenStyle()
 *
 *  Apply chosen styling to chosen lists
 *  This will run automatically on page load.  If an ajax request generates a chosen menu, you will need to
 *  call this function when the request completes successfully.
 */
function applyChosenStyle() {
    var chosenSelects = $(".chosen-select");
    // If resulting menu with is specified in class name
    var widthPrefix = "chosen-width-";
    // For each element with a specified width
    chosenSelects.filter("[class*=" + widthPrefix + "]").each(function (index) {
        var classList = $(this).attr('class').split(/\s+/);
        var widthString = undefined
        //For each class assigned to this element
        $.each(classList, function (index, className) {
            if (className.slice(0, widthPrefix.length) == widthPrefix) {
                widthString = className.replace(widthPrefix, "");
            }
        });
        //If width was found, specify it
        if (typeof widthString !== "undefined") {
            $(this).chosen({width: widthString});
        }
        //else, use standard width
        else {
            $(this).chosen();
        }
    });
    //If using default width
    chosenSelects.not("[class*=" + widthPrefix + "]").chosen();
    $(".chosen-select-display-optgroup").chosen({include_group_label_in_selected: true});

    //If chosen selects exist, make their search options screen-reader friendly
    if (chosenSelects.length > 0) {
        addLabelsToChosenSearches();
    }
}
function addLabelsToChosenSearches(){

    //Find search inputs in Chosen selects
    var chosenSearchInputs = $(".search-field").add(".chosen-search").find("input");

    //For each input, add a screen-reader label
    var ii = chosenSearchInputs.length;
    chosenSearchInputs.each(function(){
        //Check to see if input has an id (from a previous run of this function)
        var inputId = $(this).attr('id');

        //if an id is needed
        if(typeof inputId === "undefined"){
            //Try to generate a unique ID for the search input
            var newId = "chznmnusrchfld-" + ii;
            $(this).attr('id', newId);
            //Add a screen-reader label
            $(this).before('<label class="sr-only" for="'+newId+'">Search Menu Options</label>');
            ii++;
        }

    });
}


/** psuAlert()
 *
 *  Shortcut for the fancy alerts.
 *  For simple notification only.
 *  Just supply a message and title.
 */
function psuAlert(message, title){
    if(typeof title === 'undefined'){
        title = 'Alert'
    }
    $.alert({
        title: title,
        content: message,
        confirm: function(){}
    });
}


/** getAjaxLoadImage()
 *
 *  Returns a spinning icon to indicate that something is happening
 */
function getAjaxLoadImage(){
    var icon = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true" style="color:#6A7F10;"></i>';
    var aria = '<span class="sr-only">Loading...</span>';
    var loadImg = '<span class="ajaxLoadImage">'+icon+aria+'</span>';
    return loadImg;
}

/** clearAjaxLoadImage()
 *
 *  Clear the spinning icon set by getAjaxLoadImage()
 *
 *  Parameter "container" may be one of the following:
 *      undefined:      Remove all load images from entire page
 *      jQuery object:  Remove load images from given container object
 *      html id:        Remove load images from container with given ID
 */
function clearAjaxLoadImage(container){
    if(typeof container === 'undefined') {
        //remove all ajax load images (entire page)
        $(".ajaxLoadImage").remove();
    }
    else if(typeof container === 'object'){
        //remove ajax load image(s) contained within the given object
        container.find(".ajaxLoadImage").remove();
    }
    else{
        //remove ajax load image(s) contained within the element with the given ID
        $("#"+container).find(".ajaxLoadImage").remove();
    }
}

/** [set|clear]AjaxLoadDiv()
 *
 *  Display a spinning icon in the center of the screen to indicate a full-page loading action/event
 */
function setAjaxLoadDiv(){
    var spinner = '<span class="ajaxLoading">'+getAjaxLoadImage()+'</span>';
    var div = '<div class="ajaxLoading">'+spinner+'</div>';

    clearAjaxLoadDiv();     //Remove any existing loadDiv
    $('body').append(div);  //Append the loadDiv to the body
}
function clearAjaxLoadDiv(){
    $(".ajaxLoading").remove();
}


/** ajaxSave%Icon()
 *
 *  Get icon to represent successful or failed save action
 *
 */
function getAjaxSavedIcon(message){
    if(typeof message === 'undefined'){
        message = "Changes have been saved.";
    }
    var icon = '<i class="glyphicon glyphicon-floppy-saved ajax-save-result" style="color:Green;" aria-hidden="true" title="'+message+'"></i>';
    var aria = '<span class="sr-only">'+message+'</span>';
    return '<span role="alert">'+icon+aria+'</span>';
}
function getAjaxSaveFailedIcon(message){
    if(typeof message === 'undefined'){
        message = "Save failed.";
    }
    var icon = '<i class="glyphicon glyphicon-floppy-remove ajax-save-result" style="color:Red;" aria-hidden="true" title="'+message+'"></i>';
    var aria = '<span class="sr-only">'+message+'</span>';
    return '<span role="alert">'+icon+aria+'</span>';
}

/** clearAjaxSaveIcon()
 *
 *  Parameter "container" may be one of the following:
 *      undefined:      Remove all load images from entire page
 *      jQuery object:  Remove load images from given container object
 *      html id:        Remove load images from container with given ID
 */
function clearAjaxSaveIcon(container){
    if(typeof container === 'undefined') {
        //remove all visible ajax save icons
        $(".ajax-save-result").parent().remove();
    }
    else if(typeof container === 'object'){
        //remove ajax save icons(s) contained within the given object
        container.find(".ajax-save-result").parent().remove();
    }
    else{
        //remove ajax save icons(s) contained within the element with the given ID
        $("#"+container).find(".ajax-save-result").parent().remove();
    }
}

/** ajaxStatus%Icon()
 *
 *  Get icon to represent successful or failed non-save action
 *
 */
function getAjaxStatusSuccessIcon(message){
    if(typeof message === 'undefined'){
        message = "Transaction succeeded.";
    }
    var icon = '<i class="fa fa-check-circle-o ajax-status-result" style="color:Green;" aria-hidden="true" title="'+message+'"></i>';
    var aria = '<span class="sr-only">'+message+'</span>';
    return '<span role="alert">'+icon+aria+'</span>';
}
function getAjaxStatusFailedIcon(message){
    if(typeof message === 'undefined'){
        message = "Transaction failed.";
    }
    var icon = '<i class="fa fa-exclamation-triangle ajax-status-result" style="color:Red;" aria-hidden="true" title="'+message+'"></i>';
    var aria = '<span class="sr-only">'+message+'</span>';
    return '<span role="alert">'+icon+aria+'</span>';
}

/** clearAjaxStatusIcon()
 *
 *  Parameter "container" may be one of the following:
 *      undefined:      Remove all load images from entire page
 *      jQuery object:  Remove load images from given container object
 *      html id:        Remove load images from container with given ID
 */
function clearAjaxStatusIcon(container){
    if(typeof container === 'undefined') {
        //remove all visible ajax status icons
        $(".ajax-status-result").parent().remove();
    }
    else if(typeof container === 'object'){
        //remove ajax status icons(s) contained within the given object
        container.find(".ajax-status-result").parent().remove();
    }
    else{
        //remove ajax status icons(s) contained within the element with the given ID
        $("#"+container).find(".ajax-status-result").parent().remove();
    }
}


/** clearAjaxStatusClasses()
 *
 *  Clear ajax status classes (colors applied to inputs on page, not status icons)
 *
 *  Parameter "container" may be one of the following:
 *      undefined:      Remove all load images from entire page
 *      jQuery object:  Remove load images from given container object
 *      html id:        Remove load images from container with given ID
 */
function clearAjaxStatusClasses(container){
    var inputs;
    if(typeof container === 'undefined') {
        //remove all visible ajax classes
        inputs = $('input').add("select").add("textarea");
    }
    else if(typeof container === 'object'){
        //remove ajax classes contained within the given object
        inputs = container.find('input').add(container.find("select")).add(container.find("textarea"));
    }
    else{
        //remove ajax save icons(s) contained within the element with the given ID
        var cc = $("#"+container);
        inputs = cc.find('input').add(cc.find("select")).add(cc.find("textarea"));
    }

    inputs.each(function(){
        $(this).removeClass('ajax-success');
        $(this).removeClass('ajax-error');
        $(this).removeClass('ajax-pending');
    });
}


//Apply chosen style to chosen menus on page load
$(document).ready(function(){
    applyChosenStyle();
});