var showCommitiZenMenuProvider = (function () {
  "use strict";
  return {
    showPropertiesInDialog: function (properties) {
      VSS.getService("ms.vss-web.dialog-service").then(function (dialogSvc) {
        var registrationForm;
        const extInfo = VSS.getExtensionContext();
        // Azure DevOps clamps these to the room it has, so they are an upper bound.
        // The height must stay in step with the cap context.js applies to the frame,
        // or the dialog is left taller than the iframe it contains.
        const screenWidth = (window.screen && window.screen.availWidth) || 0;
        const screenHeight =
          (window.screen && window.screen.availHeight) || 900;
        const isNarrowScreen = screenWidth > 0 && screenWidth < 600;
        const frameHeight = Math.max(
          420,
          Math.min(isNarrowScreen ? 480 : 760, Math.round(screenHeight * 0.6)),
        );
        const dialogOptions = {
          title: "CommitiZen",
          width: isNarrowScreen ? 340 : 520,
          height: frameHeight + 76,
          buttons: null,
        };
        const contributionConfig = {
          properties: properties,
        };
        const contributionId =
          extInfo.publisherId + "." + extInfo.extensionId + "." + "contextForm";

        dialogSvc
          .openDialog(contributionId, dialogOptions, contributionConfig)
          .then(function (dialog) {
            // Get registrationForm instance which is registered in registrationFormContent.html
            dialog
              .getContributionInstance("registration-form")
              .then(function (registrationFormInstance) {
                registrationForm = registrationFormInstance;

                registrationForm.attachFormChanged(function () {
                  dialog.close();
                });
              });
          });
      });
    },
    execute: function (actionContext) {
      this.showPropertiesInDialog(actionContext);
    },
  };
})();

VSS.register("pr-commiti-zen", function () {
  return showCommitiZenMenuProvider;
});

VSS.init({ usePlatformScripts: true, usePlatformStyles: true });
