var showCommitiZenMenuProvider = (function () {
    "use strict";
    return {
        showPropertiesInDialog: function (properties) {
            VSS.getService("ms.vss-web.dialog-service").then(function (dialogSvc) {
                var registrationForm;                
                const extInfo = VSS.getExtensionContext();
                const dialogOptions = {
                    title: "CommitiZen",
                    width: 465,
                    height: 600,
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