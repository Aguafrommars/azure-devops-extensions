var showCommitiZenMenuProvider = (function () {
    "use strict";
    return {
        showPropertiesInDialog: function (properties) {
            VSS.getService("ms.vss-web.dialog-service").then(function (dialogSvc) {
                var registrationForm;                
                const extInfo = VSS.getExtensionContext();
                // Azure DevOps clamps these to the room it has, so they are an upper bound.
                // 440x640 is what a desktop dialog settles at; phones get a smaller frame
                // and the form scrolls whenever the content does not fit.
                const screenWidth = (window.screen && window.screen.availWidth) || 0;
                const isNarrowScreen = screenWidth > 0 && screenWidth < 600;
                const dialogOptions = {
                    title: "CommitiZen",
                    width: isNarrowScreen ? 340 : 440,
                    height: isNarrowScreen ? 560 : 640,
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