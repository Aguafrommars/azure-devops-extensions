var showCommitiZenMenuProvider = (function () {
  "use strict";
  return {
    showPropertiesInDialog: function (properties) {
      VSS.getService("ms.vss-web.dialog-service").then(function (dialogSvc) {
        var registrationForm;
        const extInfo = VSS.getExtensionContext();
        // Just the opening size. The host fills the iframe to the dialog via its
        // own CSS, and keeps it that way on manual resize — context.js must never
        // call VSS.resize, since that sets a fixed inline style that overrides it.
        const NARROW_DIALOG_WIDTH = 340;
        const NARROW_DIALOG_HEIGHT = 520;
        const DEFAULT_DIALOG_WIDTH = 520;
        const DEFAULT_DIALOG_HEIGHT = 760;
        const screenWidth = (window.screen && window.screen.availWidth) || 0;
        const isNarrowScreen = screenWidth > 0 && screenWidth < 600;
        const dialogOptions = {
          title: "CommitiZen",
          width: isNarrowScreen ? NARROW_DIALOG_WIDTH : DEFAULT_DIALOG_WIDTH,
          height: isNarrowScreen ? NARROW_DIALOG_HEIGHT : DEFAULT_DIALOG_HEIGHT,
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
