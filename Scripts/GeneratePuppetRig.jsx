/*
 GeneratePuppetRig.jsx
 for Japanese only

 パペットピンエフェクトのピンの位置にヌルレイヤーを配置し、ピンの参照先として設定する機能を提供します。
 パペットピンが設定されているレイヤーを選択し、ファイル→スクリプト から実行して下さい。
 プロジェクト内に"ヌル 1"が存在している必要があります。
 対象となるレイヤーは、レイヤーソースと同サイズのコンポジションに配置されている必要があります。

 © 2025 AQANIMATION / Kohei Mizusaki. All rights reserved.
*/

function GeneratePuppetRig()
{
	var RigSourceName = "ヌル 1";
	var RigNamePrefix = "Rig_";
	var comp = app.project.activeItem;
 
	if((comp === null) || !(comp instanceof CompItem)) {
		alert("アクティブな comp を開いて下さい。");
		return false;
	}

	var layer = comp.selectedLayers[0];
	if (layer == null) {
		alert("レイヤーが未指定です。");
		return false;
	}
	
	// パペットエフェクトを特定する
	var effects = layer.property("Effects");
	if (effects == null) {
		alert("エフェクトがありません。");
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

	//アンドゥグループを開始
	app.beginUndoGroup("GeneratePuppetRig");

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

			//ピンタイプが位置(1)以外の場合はスキップ
			if(pin.property("ADBE FreePin3 PosPin Type").value != 1) continue;

			var pinName = pin.name;
			var pinPosition = pin.property("Position").value;

			newLayer = comp.layers.add(RigSourceItem);
			newLayer.name = RigNamePrefix + pinName;
			newLayer.position.setValue(pinPosition);
			newLayer.anchorPoint.setValue([0,0]);
			newLayer.opacity.setValue(0);
	
			pin.property("Position").expression = "target = thisComp.layer(\"" + newLayer.name + "\");\ntarget.parent.toComp(target.position);";
		}
	}

	app.endUndoGroup();
}

GeneratePuppetRig();
