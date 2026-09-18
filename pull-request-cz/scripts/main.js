var showCommitiZenMenuProvider = (function () {
    "use strict";
    return {
        showPropertiesInDialog: function (properties) {
            VSS.getService("ms.vss-web.dialog-service").then(function (dialogSvc) {
                var registrationForm;                
                const extInfo = VSS.getExtensionContext();
                // This action runs in a small host frame, so window size is not the viewport; use the screen instead.
                const screenWidth = (window.screen && window.screen.availWidth) || 0;
                const screenHeight = (window.screen && window.screen.availHeight) || 0;
                const dialogWidth = screenWidth && screenWidth < 560 ? Math.max(280, screenWidth - 24) : 465;
                const dialogHeight = screenHeight && screenHeight < 700 ? Math.max(320, screenHeight - 96) : 600;
                const dialogOptions = {
                    title: "CommitiZen",
                    width: dialogWidth,
                    height: dialogHeight,
                    buttons: null
                };
                const contributionConfig = {
                    properties: properties
                };
                const contributionId = extInfo.publisherId + "." + extInfo.extensionId + "." + "contextForm";
                
                dialogSvc.openDialog(contributionId, dialogOptions, contributionConfig)
                    .then(function(dialog) {
                        // Get registrationForm instance which is registered in registrationFormContent.html
                        dialog.getContributionInstance("registration-form").then(function (registrationFormInstance) {
                            registrationForm = registrationFormInstance;
                        
                            registrationForm.attachFormChanged(function() {
                                dialog.close();
                            });
                        });
                    });
            });
        },
        execute: function(actionContext) {
            this.showPropertiesInDialog(actionContext);
        }
    };
}());

VSS.register("pr-commiti-zen", function () {
    return showCommitiZenMenuProvider;
});

VSS.init({ usePlatformScripts: true, usePlatformStyles: true });