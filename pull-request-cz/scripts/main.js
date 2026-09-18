var showCommitiZenMenuProvider = (function () {
    "use strict";
    return {
        showPropertiesInDialog: function (properties) {
            VSS.getService("ms.vss-web.dialog-service").then(function (dialogSvc) {
                var registrationForm;                
                const extInfo = VSS.getExtensionContext();
                const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 465;
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 600;
                const dialogWidth = Math.max(280, Math.min(520, viewportWidth - 24));
                const dialogHeight = Math.max(320, Math.min(680, viewportHeight - 24));
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