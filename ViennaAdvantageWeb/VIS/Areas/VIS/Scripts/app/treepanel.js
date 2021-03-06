﻿; (function (VIS, $) {

    function TreePanel(windowNo, hasBar, editable) {


        this.selectionChangeListner = null; //tree selection changed
        this.windowNo = windowNo;
        var tableName = "";
        var rootNode = null;

        var treeValues = [];
        var treeText = [];
        var lastSeletedIndex = -1; //tree search textbox

        var contextNode = null;
        var movingNode = null;
        var targetNode = null;
        var AD_Tree_ID = 0;



        //UI
        var $root = null;
        var $treeRoot = null, $searchRoot = null, $text = null, $btn = null;
        var $btnSearch = null, $txtSearch = null;
        var $ulPopup = null;
        var $liCopy, $liMove, $liCancel;

        function initializeComponent() {

            $root = $("<table style='width:100%;height:100%'><tr><td style='height:100%'><div class='vis-css-treewindow' ></td></tr>" +
                     "<tr><td style='text-align:center'><div class='vis-tree-search'><div class='input-group'>" +
                        "<input type='text' class='form-control ui-autocomplete-input' placeholder='Search'>" +
                        "  <span class='input-group-addon'><a href='#' class='glyphicon glyphicon-search'></a></span>" +
                    "</div></div></td></tr></table>");

            //$root = $("<div class='vis-height-full' >");
            $treeRoot = $root.find(".vis-css-treewindow");
            $treeRoot.css({ 'margin-left': '5px', "max-width": "295px", "background-color": "#eee" });
            $searchRoot = $root.find(".vis-tree-search");
            $btnSearch = $root.find(".input-group-addon");
            $txtSearch = $root.find("input");
            // $root.append($treeRoot).append($searchRoot);

            $ulPopup = $("<ul class='vis-apanel-rb-ul'>");
            $liCopy = $("<li data-action='Copy'>").text(VIS.Msg.getMsg("Copy"));
            $liMove = $("<li data-action='Move'>").text(VIS.Msg.getMsg("Move"));
            $liCancel = $("<li data-action='Cancel'>").text(VIS.Msg.getMsg("Cancel"));

            $ulPopup.append($liCopy).append($liMove).append($liCancel);


        };
        initializeComponent();

        var self = this;

        this.setSize = function (height, width) {
            //$root.height(height);
            $treeRoot.height(height - 40);
        };

        this.initTree = function (_AD_Tree_ID) {
            AD_Tree_ID = _AD_Tree_ID;
            var data = { AD_Tree_ID: AD_Tree_ID, editable: editable, windowNo: windowNo };
            AD_Tree_ID = AD_Tree_ID;
            VIS.dataContext.getTreeAsString(data, function (str) {

                $treeRoot.html(str);
                createArray();
                rootNode = $treeRoot.find(">ul");
                tableName = rootNode.data("tablename");
                rootNode = rootNode.find(">li>ul");
            });
        };

        function moveNode() {
            if (movingNode == null || targetNode == null || movingNode == targetNode)
                return;

            var oldParent = movingNode.parent(); // Moving LI Item

            movingNode.remove(); //Remove Item From Tree

            var oldId = oldParent.parent().data("value"); //find Li of this UL List

            var newId = null;

            var newParent = targetNode; //set PrentNode
            var index = 0;
            if (targetNode.data("summary") != 'Y') { //If Not a Leaf Node
                newParent = targetNode.parent(); //Find New Parnet 
                index = targetNode.index(); //Index Of Taget Node
                movingNode.insertAfter(newParent.children()[index]); //Insert New Node After this Node
                newId = newParent.parent().data("value"); //get Id New Parent
            }
            else { //Summary Node

                var targetC = newParent.find(">ul"); //find Ul of summary LI
                if (targetC.children().length > 0) //Has Child
                {
                    movingNode.insertBefore(targetC.children()[index]); //Insert At Index ))
                }
                else
                    movingNode.appendTo(targetC); //Append Child

                newId = newParent.data("value");//New Parent Id
                newParent = targetC; //Set new Parent
            }

            var queries = [];

            var childs = oldParent.children();
            var i = 0;
            var sql = "";

            for (var i = 0; i < childs.length; i++) {
                var nd = $(childs[i]);
                //StringBuilder sql = new StringBuilder("UPDATE ");
                sql = "UPDATE ";
                sql += tableName + " SET Parent_ID=" + oldId + ", SeqNo=" + i + ", Updated=SysDate" +
                                  " WHERE AD_Tree_ID=" + AD_Tree_ID + " AND Node_ID=" + nd.data("value");
                //log.Fine(sql.ToString());
                queries.push(sql);
            }
            if (oldId != newId) {
                childs = newParent.children();
                i = 0;
                for (i = 0; i < childs.length; i++) {
                    var nd = $(childs[i]);
                    sql = "UPDATE ";
                    sql += tableName + " SET Parent_ID=" + newId +
                    ", SeqNo=" + i + ", Updated=SysDate" +
                     " WHERE AD_Tree_ID=" + AD_Tree_ID +
                      " AND Node_ID=" + nd.data("value");
                    queries.push(sql);
                }
            }
            console.log(queries);
            VIS.DB.executeQueries(queries, null, function (ret) {
                console.log(ret);
                rootNode
            });
        }

        function createArray() {
            treeValues.length = 0;
            treeText.length = 0;
            $treeRoot.find("LI").each(function (key, val) {
                var s = $(val);
                var v = s.find(">label");
                if (v.length < 1) {
                    v = s.find(">A");
                }
                treeValues.push(s.data("value"));
                treeText.push(v.text());
            });
        };

        //Privilzed function
        this.getRoot = function () {
            return $root;
        };

        $treeRoot.on(VIS.Events.onClick, function (event) {
            if (event.target.nodeName === "INPUT" || event.target.nodeName === "LI" || event.target.nodeName === "A") {
                var o = $(event.target);
                if (event.target.nodeName === "INPUT")
                    o = $(event.target.parentNode);
                if (self.selectionChangeListner)
                    self.selectionChangeListner.nodeSelectionChanged({ newValue: o.data("value"), propertyName: "" });
                event.stopPropagation();
            }
            else if (event.target.nodeName === "SPAN" && (event.target.parentNode.nodeName == "SPAN" || event.target.parentNode.nodeName == "LI")) {
                var o1 = $(event.target.parentNode);
                if (event.target.parentNode.nodeName === "SPAN")
                    o1 = $(event.target.parentNode.parentNode);

                //Set Up Ul
                contextNode = o1;

                $liCopy.hide();
                $liCancel.hide();
                $liMove.hide();
                if (movingNode != null) {
                    //if (o1.data("summary") !== 'Y')
                    //    return;
                    $liMove.show();
                    $liCancel.show();
                }
                else {
                    $liCopy.show();
                }
                $(event.target).w2overlay($ulPopup.clone(true));
            }
        });

        $btnSearch.on(VIS.Events.onTouchStartOrClick, function (event) {

            var text = $txtSearch.val();//  $rootTree.find("li[data-value='" + nodeID + "']");
            if (text == null || text.length < 2)
                return;

            var index = self.containsTextInArray(treeText, text, lastSeletedIndex)
            if (index > -1) {
                var val = treeValues[index];
                lastSeletedIndex = index;
                self.setSelectedNode(val);
                if (self.selectionChangeListner)
                    self.selectionChangeListner.nodeSelectionChanged({ newValue: val, propertyName: "" });

            }
        });

        $ulPopup.on(VIS.Events.onTouchStartOrClick, "LI", function (e) {
            var action = $(e.target).data("action");
            if (action == 'Copy') {
                movingNode = contextNode;
            }
            else if (action == 'Move') {
                targetNode = contextNode;
                moveNode();
                movingNode = null;
                targetNode = null;
                contextNode = null;
            }
            else if (action == 'Cancel') {
                movingNode = null;
                contextNode = null;
            }
        });

        this.getRootNode = function () {
            return rootNode;
        };

        this.disposeLocal = function () {
            $treeRoot.off(VIS.Events.onClick);
            $btnSearch.off(VIS.Events.onTouchStartOrClick);
            $ulPopup.off(VIS.Events.onTouchStartOrClick);
            $ulPopup = null;
            $treeRoot = null;
            $root.remove();
            $root = null;
            self = null;
        };
    };

    TreePanel.prototype.containsTextInArray = function (arry, text, lastSelIndex) {

        for (var i = lastSelIndex + 1; i < arry.length; i++) {
            if (i == -1)
                continue;
            if (arry[i].trim().toLowerCase().contains(text.trim().toLowerCase()))
                return i;
        };
        if (lastSelIndex > -1) {
            lastSelIndex = -1;
            return this.containsTextInArray(arry, text, lastSelIndex);
        }
        return -1;
    };

    TreePanel.prototype.addSelectionChangeListner = function (listner) {
        this.selectionChangeListner = listner;
    };

    /**
     *  Set Selection to Node in Event
     *  @param nodeID Node ID
     * 	@return true if selected
     */
    TreePanel.prototype.setSelectedNode = function (nodeID) {
        //log.config("ID=" + nodeID);
        if (nodeID != -1) {				//	new is -1
            return this.selectID(nodeID, true);     //  show selection
        }
        return false;
    }; //  setSelectedNode

    /*  Select ID in Tree
      *  @param nodeID	Node ID
      *  @param show	scroll to node
      * 	@return true if selected
      */
    TreePanel.prototype.selectID = function (nodeID, show) {
        var root = this.getRoot();

        var node = root.find("li[data-value='" + nodeID + "']");
        if (node != null && node.length > 0) {
            var selNode = root.find("*.vis-css-treewindow-selected");
            if (selNode.length > 0)
                selNode.removeClass("vis-css-treewindow-selected");

            if (node.find(">label").length > 0) {
                node.find(">label").addClass("vis-css-treewindow-selected");
            }
            else {

                node.find(">a").addClass("vis-css-treewindow-selected");
            }

            var oNode = node;
            while (node != null) {

                var c = node.find("input");

                if (c.length > 0) {
                    if (!c.prop("checked"))
                        c.prop("checked", true);
                }

                node = node.parent();
                if (node[0].nodeName == "UL") {
                    node = node.parent();
                }
                if (node[0].nodeName == "LI") {
                    ;
                }

                else
                    node = null;
            }
            oNode[0].scrollIntoView();
            return true;
        }
        //log.info("Node not found; ID=" + nodeID);
        return false;
    }   //  selectID

    /**************************************************************************
	 *  Node Changed - synchromize Node
	 *
	 *  @param  save    true the node was saved (changed/added), false if the row was deleted
	 *  @param  keyID   the ID of the row changed
	 *  @param  name	name
	 *  @param  description	description
	 *  @param  isSummary	summary node
	 *  @param  imageIndicator image indicator
	 */
    TreePanel.prototype.nodeChanged = function (save, keyID,
		 name, description, isSummary, imageIndicator) {
        console.log("Save=" + save + ", KeyID=" + keyID
        	+ ", Name=" + name + ", Description=" + description
        	+ ", IsSummary=" + isSummary + ", ImageInd=" + imageIndicator);
        //	+ ", root=" + m_root);
        //	if ID==0=root - don't update it
        if (keyID == 0)
            return;

        var root = this.getRoot();
        var found = false;
        var node = root.find("li[data-value='" + keyID + "']");
        if (node != null && node.length > 0) {
            found = true;
        }

        //  Node not found and saved -> new
        if (!found && save) {
            var rn = this.getRootNode();
            rn.append(this.getNode(keyID, name, description, isSummary, imageIndicator, this.windowNo));
        }

            //  Node found and saved -> change
        else if (found && save) {

            this.toggleTypeOfNode(node, isSummary, keyID, this.windowNo, imageIndicator);
            //node.data("summary", isSummary ? "Y" : "N");
            if (isSummary) {
                if (node.find(">ul").length == 0) {
                    node.append($("<ul>"));
                }
            }

            var txt = node.find(">label");
            if (!txt || txt.length == 0)
                txt = node.find(">a");

            if (txt.length > 0)
                txt.text(name);
        }

            //  Node found and not saved -> delete
        else if (found && !save) {
            var childs = node.find(">ul");
            if (childs.length > 0) {
                childs.remove();
                this.getRootNode().append(childs.children());
            }
            node.remove();
        }

            //  Error
        else {
            //log.log(Level.SEVERE, "Save=" + save + ", KeyID=" + keyID + ", Node=" + node);
            node = null;
        }

        //  Nothing to display
        if (node == null)
            return;
    };  //  nodeChanged

    TreePanel.prototype.getNode = function (keyID, name, description, isSummary, imageIndicator, windowNo) {
        var str = '<li data-value="' + keyID + '"';
        if (isSummary) {
            str += 'data-summary="Y" class="vis-hasSubMenu"> ' +
                   '<input type="checkbox" id="' + windowNo + keyID + '">' +
                   '<label for="' + windowNo + keyID + '">' + name + '</label><span class="vis-treewindow-span">' +
                   '<span class="vis-css-treewindow-arrow-up"></span></span><ul><ul>';
        }

        else {
            str += 'data-summary="N"> ' +
            ' <img src="' + VIS.Application.contextUrl + 'Areas/VIS/Images/login/' + this.getIcon(imageIndicator) + '"> ' +
             ' <a href="javascript:void(0)" data-value="' + keyID + '" data-action="' + imageIndicator + '" data-actionid="' + keyID + '"> ' +
             name + '</a><span class="vis-treewindow-span"><span class="vis-css-treewindow-arrow-up"> ' +
             '</span></span></li>';
        }

        return $(str);
    };

    TreePanel.prototype.getIcon = function (initial) {
        switch (initial) {
            case "W":
                return "mWindow.png";
            case "R":
                return "mReport.png";
            case "P":
                return "mProcess.png";
            case "F":
                return "mWorkflow.png";
            case "B":
                return "mWorkbench.png";
            case "X":
                return "mWindow.png";
            case "V":
                return "mWindow.png";
            case "D":
                return "mDocAction.png";
            default:
                return "mWindow.png";
        }
    };

    TreePanel.prototype.toggleTypeOfNode = function (node, isSummary, keyID, windowNo, imageIndicator) {
        var sum = node.data("summary") == "Y";
        if (isSummary !== sum) {
            var ul = node.find(">ul");
            ul.remove();
            node.data("summary", isSummary ? "Y" : "N");
            node.toggleClass("vis-hasSubMenu");

            if (isSummary) {
                node.html('<input type="checkbox" id="' + windowNo + keyID + '">' +
                '<label for="' + windowNo + keyID + '">' + name + '</label><span class="vis-treewindow-span">' +
                '<span class="vis-css-treewindow-arrow-up"></span></span>');
            }
            else {
                node.html('<img src="/ViennaHTML/Areas/VIS/Images/login/' + this.getIcon(imageIndicator) + '"> ' +
                          ' <a href="javascript:void(0)" data-value="' + keyID + '" data-action="' + imageIndicator + '" data-actionid="' + keyID + '"> ' +
                          name + '</a><span class="vis-treewindow-span"><span class="vis-css-treewindow-arrow-up"> ' +
                          '</span></span>');
            }
            if (ul.length > 0)
                node.append(ul);
        }
        else if (!isSummary) {
            var a = node.find(">a");
            if (a.length > 0) {
                var action = a.data("action");
                if (a != imageIndicator) {
                    node.find(">img").attr('src', '/ViennaHTML/Areas/VIS/Images/login/' + this.getIcon(imageIndicator));
                    a.data("action", imageIndicator);
                }
                a = action = null;
            }
        }
    };

    TreePanel.prototype.dispose = function () {
        this.disposeLocal();
        this.addPropertyChangeListner = null;
    };

    VIS.TreePanel = TreePanel;

})(VIS, jQuery);
