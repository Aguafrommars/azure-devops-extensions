"use strict";

VSS.require("TFS/Dashboards/WidgetHelpers", function (WidgetHelpers) {
    WidgetHelpers.IncludeWidgetStyles();
    WidgetHelpers.IncludeWidgetConfigurationStyles();
});

// We need to register the new contribution if this extension host is reused
function registerContribution(context) {
    const pr = VSS.getConfiguration().properties.pullRequest;
    var selectedType;
    const commitTypes = ["feat - A new feature",
    "fix - A bug fix",
    "docs - Documentation only changes",
    "style - Changes that not affect the meaning of the code",
    "refactor - A code change that neither fix a bug nor adds a feature",
    "perf - A code change that improves performance",
    "test - Adding missing tests or correcting existing tests",
    "build - Changes that affect the build system or external dependencies",
    "ci - Changes to oour CI configuration files ans scripts",
    "revert - Revert a previous commit"
    ];

    var typeValue;
    pr.pullRequestCard = pr.pullRequestCard || {};
    pr.pullRequestCard.gitPullRequest = pr.pullRequestCard.gitPullRequest || {};
    const completionOptions = pr.pullRequestCard.gitPullRequest.completionOptions;
    if (completionOptions) {
        const msg =  completionOptions.mergeCommitMessage;
        const msgHeaders = msg.split(":")[0].split("(");
        const commitType = msgHeaders[0];
        for (const s of commitTypes) {
            if (s.startsWith(commitType)) {
                selectedType = commitType;
                typeValue = s;
                break;
            }
        }
        if (msgHeaders.length > 1) {
            const scope = msgHeaders[1].split(")")[0];
            if (scope) {
                $("#scope").val(scope);
            }
        }
        const msgSegments = msg.split("\n");
        const firstLine = msgSegments[0];
        const subject = firstLine.substring(firstLine.indexOf(": ") + 2);
        $("#subject").val(subject);
        var body = "";
        for(var i = 2; i < msgSegments.length; i++) {
            const line = msgSegments[i];
            if (line.startsWith("BREAKING CHANGE: ")) {
                $("#breaking-changes").val(line.split("BREAKING CHANGE: ")[1]);
            } else if (line.startsWith("Closes: ")) {
                $("#closes").val(line.split("Closes: ")[1]);
            } else {
                body = body + line + '\n';
            }
        }

        $("#msgbody").val(body.trim());

        document.getElementById("squash").checked = completionOptions.squashMerge || false;
        document.getElementById("delete-source-branch").checked = completionOptions.deleteSourceBranch || true;
        document.getElementById("complete-workitems").checked = completionOptions.transitionWorkItems || true;
    } else {
        $("#subject").val(pr.description);
    }

    var saveSquash = false;
    if (pr.status === 2 || pr.status === 3) {
        $("#auto-complete").hide();
        $("#complete").hide(); 
    }

    if (pr.canComplete === false) {
        $("#complete").hide();    
    }

    VSS.require(["VSS/Service", "TFS/VersionControl/GitRestClient"], function (VSS_Service, TFS_Wit_WebApi) {
        // Get the REST client
        const gitClient = VSS_Service.getCollectionClient(TFS_Wit_WebApi.GitHttpClient2_2);

        gitClient.getPullRequestWorkItemRefs = gitClient.getPullRequestWorkItemRefs || gitClient.getPullRequestWorkItems;
        gitClient.getPullRequestWorkItemRefs(pr.repositoryId, pr.pullRequestId)
            .then(function(items) {
                var closes = getInputValue("closes") || "";
                for (const item of items) {
                    const id = `#${item.id}`;
                    if (closes.indexOf(id) === -1) {
                        if (closes.length > 0) {
                            closes = `${closes}, ${id}`;
                        } else {
                            closes = id;
                        }
                    }
                }

                $("#closes").val(closes);
                if (items.length === 0) {
                    var checkbox = document.getElementById("complete-workitems");
                    checkbox.disabled = true;
                    checkbox.checked = false;
                }
            }, function(error) {
                showError(error.message || "Unknow exception");
            });
    });

    VSS.getAccessToken()
    .then(function(token) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `${context.collection.uri}${pr.projectGuid}/_apis/policy/evaluations?artifactId=${encodeURIComponent(`vstfs:///CodeReview/CodeReviewId/${pr.projectGuid}/${pr.codeReviewId}`)}`);
        xhr.setRequestHeader("Authorization", "Bearer " + token.token);
        xhr.onload = function () {
            if (xhr.status === 200) {
                const policies = JSON.parse(xhr.responseText).value;
                for (const policy of policies) {
                    const configuration = policy.configuration;
                    if (configuration.isEnabled) {
                        const settings = configuration.settings;
                        if (settings.allowNoFastForward !== undefined || settings.allowSquash !== undefined || settings.useSquashMerge !== undefined) {
                            const squash = document.getElementById("squash");
                            saveSquash = false;
                            squash.disabled = true;
                            squash.checked = settings.allowNoFastForward ? false : settings.allowSquash || settings.useSquashMerge;
                        } else if (configuration.isBlocking && policy.status !== "approved") {
                            $("#complete").hide();
                        }
                    }
                }

                if ($("#complete").is(":visible")) {
                    $("#auto-complete").hide();
                }
            } else {
                console.error(xhr.responseText);
            }

            VSS.getService(VSS.ServiceIds.ExtensionData).then(function(dataService) {
                // Get value in user scope
                dataService.getValue("preferences", {scopeType: "User"}).then(function(value) {
                    if (!value) {
                        return;
                    }
                    if (!saveSquash) {
                        document.getElementById("squash").checked = value.squashMerge;                    
                    }
                    var checkbox = document.getElementById("complete-workitems");
                    if (!checkbox.disabled) {
                        checkbox.checked = value.transitionWorkItems;
                    }
                    document.getElementById("delete-source-branch").checked = value.deleteSourceBranch;
                });
            });
                    
        };
        xhr.send();        
    });

    createTypeCombo();

    function createTypeCombo() {
        VSS.require(["VSS/Controls", "VSS/Controls/Combos"], function(Controls, Combos) {
            const container = $("#type-of-change");            
            const makeOptions = {
                value: typeValue,
                width: "413px",
                source:
                commitTypes,
                change: function () {
                  selectedType = this.getText().split(' - ')[0];
                }
              };
            
             // Create the combo in a container element
             $("<label />").text("Type:").appendTo(container);
             Controls.create(Combos.Combo, container, makeOptions);
        });
    }

    function getInputValue(id) {
        const value = $("#" + id).val();
        if (value) {
            return value;
        }

        return "";
    }

    const registrationForm = (function() {
        var callbacks = [];

        $("#cancel").on("click", function() {
            notify();
        });
            
        $("#auto-complete").on("click", function() {
            const error = validateForm();
            if (error) {
                showError(error);
                return;
            }
            hideError();
            VSS.require(["VSS/Service", "TFS/VersionControl/GitRestClient"], function (VSS_Service, TFS_Wit_WebApi) {
                // Get the REST client
                const gitClient = VSS_Service.getCollectionClient(TFS_Wit_WebApi.GitHttpClient2_2);

                const patch = {
                    autoCompleteSetBy: {
                        id: context.user.id
                    },
                    completionOptions: getCompletionOptions()
                }
    
                gitClient.updatePullRequest(patch, pr.repositoryId, pr.pullRequestId)
                    .then(function() {
                        notify();
                    }, function(error) {
                        showError(error.message || "Unknow exception");
                    });
            });
        });

        $("#complete").on("click", function() {
            const error = validateForm();
            if (error) {
                showError(error);
                return;
            }
            hideError();
            VSS.require(["VSS/Service", "TFS/VersionControl/GitRestClient"], function (VSS_Service, TFS_Wit_WebApi) {
                // Get the REST client
                const gitClient = VSS_Service.getCollectionClient(TFS_Wit_WebApi.GitHttpClient2_2);
    
                const patch = {
                    status: 3,
                    completionOptions: getCompletionOptions(),
                    lastMergeSourceCommit: pr.pullRequestCard.gitPullRequest.lastMergeSourceCommit
                }
    
                gitClient.updatePullRequest(patch, pr.repositoryId, pr.pullRequestId)
                    .then(function() {
                        notify();
                    }, function(error) {
                        showError(error.message || "Unknow exception");
                    });
            });            
        });

        function validateForm() {
            var error;
            if (!selectedType) {
                error = "The type must be selected."
            }
            if (!getInputValue("subject")) {
                error = error + "The subject cannot be empty.";
            }

            return error;
        }
    
        function getCompletionOptions() {
            const completionOptions = {};
            var mergeCommitMessage = selectedType;
            const scope = getInputValue("scope");
            if (scope) {
                mergeCommitMessage = mergeCommitMessage + `(${scope})`
            }
            mergeCommitMessage = mergeCommitMessage + `: ${getInputValue("subject")}\n\n${getInputValue("msgbody")}`
            const breakingChanges = getInputValue("breaking-changes");
            const closes = getInputValue("closes");
            if (breakingChanges || closes) {
                mergeCommitMessage = mergeCommitMessage + "\n\n";
            }
            if (breakingChanges) {
                mergeCommitMessage = mergeCommitMessage + `BREAKING CHANGE: ${breakingChanges}\n`
            }
            if (closes) {
                mergeCommitMessage = mergeCommitMessage + `Closes: ${closes}\n`
            }
            completionOptions.mergeCommitMessage = mergeCommitMessage;
            if (document.getElementById("squash").checked) {
                completionOptions.squashMerge = true;
            } else {
                completionOptions.squashMerge = false;
            }
            if (document.getElementById("delete-source-branch").checked) {
                completionOptions.deleteSourceBranch = true;
            } else {
                completionOptions.deleteSourceBranch = false;
            }
            if (document.getElementById("complete-workitems").checked) {
                completionOptions.transitionWorkItems = true;
            } else {
                completionOptions.transitionWorkItems = false;
            }

            VSS.getService(VSS.ServiceIds.ExtensionData).then(function(dataService) {
                // Set value in user scope
                const preferences = {
                    transitionWorkItems: completionOptions.transitionWorkItems,
                    deleteSourceBranch: completionOptions.deleteSourceBranch
                }
                if (!saveSquash) {
                    preferences.squashMerge = completionOptions.squashMerge;
                }
                dataService.setValue("preferences", preferences, {scopeType: "User"}).then(function(value) {
                });
            });
            
            return completionOptions;
        }

        function showError(error) {
            document.getElementById("error").textContent = error;
            const $error = $(".validation-error");
            $error.css("visibility", "visible");
        }

        function hideError() {
            const $error = $(".validation-error");
            $error.css("visibility", "hidden");
        }

        function notify() {
            for(var i = 0; i < callbacks.length; i++) {
                callbacks[i]();
            }
        }

        document.getElementById("delete-source-branch-label").textContent = `Delete ${pr.sourceFriendlyName} after merging`;

        return {
            attachFormChanged: function(cb) {
                callbacks.push(cb);
           }
        }
    })();

    VSS.register("registration-form", registrationForm);
}

VSS.init({explicitNotifyLoaded: true, usePlatformScripts: true, usePlatformStyles: true, extensionReusedCallback: registerContribution });

// Show context info when ready
VSS.ready(function () {
    const context = VSS.getWebContext();
    registerContribution(context);    
    VSS.notifyLoadSucceeded();
});