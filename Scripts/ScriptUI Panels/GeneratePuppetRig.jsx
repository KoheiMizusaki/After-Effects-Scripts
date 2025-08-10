/*
 GeneratePuppetRig.jsx
 for Japanese only

 パペットピンエフェクトのピンの位置にヌルレイヤーを配置し、ピンの参照先として設定する機能を提供します。
 パペットピンが設定されているレイヤーを選択し、実行ボタンをクリックして下さい。
 プロジェクト内に"ヌル 1"が存在している必要があります。

 © 2025 AQANIMATION / Kohei Mizusaki. All rights reserved.
*/

var RigSourceName = "ヌル 1";
var RigNamePrefix = "Rig_";

(function (thisObj) {

	thisObj.orientation = "column";
	thisObj.alignChildren = ["left", "top"];

	// レイヤー名のプレフィックス
	var group = thisObj.add("group");
	group.orientation = "row";
	group.alignChildren = ["left", "center"];
	group.add("statictext", undefined, "レイヤー名のプレフィックス");
	var RigNamePrefixInput = group.add("edittext", undefined, RigNamePrefix);
	RigNamePrefixInput.characters = 5;
	RigNamePrefixInput.onChange = function () {
		RigNamePrefix = this.text;
	}

	// 実行ボタン
	var group = thisObj.add("group");
	group.alignChildren = ["right", "center"];
	var btn = group.add("button", undefined, "実行");
	btn.onClick = function () { GeneratePuppetRig(); return; };
	
	// サイズ変更に対応
	thisObj.layout.layout(true);
	thisObj.layout.resize();
	thisObj.onResizing = thisObj.onResize = function () { this.layout.resize(); };

})(this);

function GeneratePuppetRig()
{
	var comp = app.project.activeItem;
 
	if((comp === null) || !(comp instanceof CompItem)) {
		alert("アクティブな comp を開いて下さい。");
		return false;
	}

	var sourceLayer = comp.selectedLayers[0];
	if (sourceLayer == null) {
		alert("レイヤーを選択してから実行して下さい。");
		return false;
	}
	
	// パペットエフェクトを特定する
	var effects = sourceLayer.property("Effects");
	if (effects == null) {
		alert("パペットエフェクトがありません。");
		return false;
	}

	var puppet = null;
	for (var i = 1; i <= effects.numProperties; i++) {
		var eff = effects.property(i);
		if (eff.matchName == "ADBE FreePin3") { // パペットエフェクト
			puppet = eff;
			break;
		}
	}

	if (puppet == null) {
		alert("パペットエフェクトが見つかりません。");
		return false;
	}

	// ARAP Groupを特定する
	for(var i = 1; i <= puppet.numProperties; ++i) {
		if(puppet.property(i).matchName == "ADBE FreePin3 ARAP Group") {
			arap = puppet.property(i);
			break;
		}
	}

	if (arap == null) {
		alert("ARAP Groupがありません。");
		return false;
	}

	// Mesh Groupを特定する
	for(var i = 1; i <= arap.numProperties; ++i) {
		if(arap.property(i).matchName == "ADBE FreePin3 Mesh Group") {
			mesh = arap.property(i);
			break;
		}
	}

	if (mesh == null) {
		alert("Mesh Groupがありません。");
		return false;
	}

	//Rigのソースとするフッテージを特定する
	for(var i = 1; i <= app.project.items.length; ++i) {
		if(app.project.item(i).name == RigSourceName) {
			RigSourceItem = app.project.item(i);
			break;
		}
	}
	
	if(RigSourceItem == null) {
		alert(RigSourceName + "が見つかりません。");
		return false;
	}

	// アンドゥグループを開始
	app.beginUndoGroup("GeneratePuppetRig");

	// 原点レイヤーを作成する
	var originLayer = comp.layers.add(RigSourceItem);
	originLayer.name = RigNamePrefix + sourceLayer.name + "_Origin";
	originLayer.position.setValue(sourceLayer.position.value);
	originLayer.anchorPoint.setValue(sourceLayer.anchorPoint.value);
	originLayer.scale.setValue(sourceLayer.scale.value);
	originLayer.opacity.setValue(0);

	// ソースレイヤーの位置にエクスプレッションを適用する
	sourceLayer.position.expression = "thisComp.layer(\"" + originLayer.name + "\").position";
	
	// Mesh Atomでループ処理する
	for(var i = 1; i <= mesh.numProperties; ++i) {
		if(mesh.property(i).matchName != "ADBE FreePin3 Mesh Atom") {
			continue;
		}
		atom = mesh.property(i);
	
		// ピンのリストを取得する
		if(atom.property("ADBE FreePin3 PosPins").numProperties == 0) {
			alert("パペットピンがありません。");
			return false;
		}
	
		var pins = atom.property("ADBE FreePin3 PosPins");
		var pinList = [];
	
		for (var j = pins.numProperties; j >= 1; --j) {
			var pin = pins.property(j);

			// ピンタイプが位置(1)以外の場合はスキップ
			if(pin.property("ADBE FreePin3 PosPin Type").value != 1) continue;

			// ピンの名前と位置を変数へ代入する
			var pinName = pin.name;
			var pinPosition = pin.position.value;

			// ピンの参照先レイヤーを作成する
			newLayer = comp.layers.add(RigSourceItem);
			newLayer.parent = originLayer;
			newLayer.name = RigNamePrefix + pinName;
			newLayer.position.setValue(pinPosition);
			newLayer.anchorPoint.setValue([0,0]);
			newLayer.opacity.setValue(0);
	
			// ピンの位置にエクスプレッションを適用する
			pin.position.expression = "target = thisComp.layer(\"" + newLayer.name + "\");\norigin = thisComp.layer(\"" + originLayer.name + "\");\ntarget.parent.toComp(target.position) - origin.position + origin.anchorPoint;";
		}
	}

	app.endUndoGroup();
}
