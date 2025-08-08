/*
 Nulltilities.jsx
 for Japanese only

 ヌルレイヤーの作成や操作に関する機能群を提供します。

 ■ ヌル化(Nullize)
 選択したレイヤーのアンカーポイントを[0,0]、透明度を0%に設定します。

 ■ 親ヌル追加(Add Parent Null)
 選択レイヤーに対して親となるヌルレイヤーを追加し、位置・回転・スケールの値を親ヌルに設定します。
 回転・スケールの継承はチェックボックスで個別に切り替え可能です。
 プロジェクト内に"ヌル 1"が存在している必要があります。

 © 2025 AQANIMATION / Kohei Mizusaki. All rights reserved.
*/

var AddParentNull_Rotation_Checked = true;
var AddParentNull_Scale_Checked = true;

(function (thisObj) {

	// パネルUIを作成する
	function Nulltilities_buildUI(thisObj) {
		var myPanel = (thisObj instanceof Panel)
			? thisObj
			: new Window("palette", "Nulltilities", undefined, { resizeable: true });
		
		//ボタン追加:ヌル化
		var group_Nullize = myPanel.add("panel", undefined, "ヌル化");
		group_Nullize.alignChildren = ["fill", "top"];
		var btn = group_Nullize.add("button", undefined, "実行");
		btn.onClick = function () { Nulltilities_Nullize(); return; };

		//UIグループ:親ヌル追加
		var group_AddParentNull = myPanel.add("panel", undefined, "親ヌル追加");
		group_AddParentNull.alignChildren = ["fill", "top"];

		//チェックボックス:回転
		var checkRotation = group_AddParentNull.add("checkbox", undefined, "回転");
		checkRotation.value = AddParentNull_Rotation_Checked;
		checkRotation.onClick = function() {
			AddParentNull_Rotation_Checked = this.value;
		}

		//チェックボックス:スケール
		var checkScale = group_AddParentNull.add("checkbox", undefined, "スケール");
		checkScale.value = AddParentNull_Scale_Checked;
		checkScale.onClick = function() {
			AddParentNull_Scale_Checked = this.value;
		}

		//実行ボタン
		var btn = group_AddParentNull.add("button", undefined, "実行");
		btn.onClick = function () { Nulltilities_AddParentNull(); return; };
		
		// サイズ変更に対応
		myPanel.layout.layout(true);
		myPanel.layout.resize();
		myPanel.onResizing = myPanel.onResize = function () { this.layout.resize(); };

		return myPanel;
	}

	// 実行
	var myPal = Nulltilities_buildUI(thisObj);
	if (myPal instanceof Window) {
		myPal.center();
		myPal.show();
	}

})(this);

/*
 選択されたレイヤーを取得する
 */
function getActiveLayers() {
	var comp = app.project.activeItem;
	if ((comp === null) || !(comp instanceof CompItem)) {
		return [];
	}

	var layers = comp.selectedLayers;
	if (layers.length == 0 || layers[0] == null) {
		return [];
	}

	return layers;
}

/*
 ボタンアクション:ヌル化
 */
function Nulltilities_Nullize() {
	var layers = getActiveLayers();
	if (layers.length == 0) {
		alert("レイヤーを選択して下さい。");
		return false;
	}

	// アンドゥグループを開始
	app.beginUndoGroup("Nullize");

	// 各レイヤーに対して処理を実行
	for (var i = 0; i < layers.length; i++) {
		var layer = layers[i];

		// AVLayerのみ処理（テキスト、シェイプ、フッテージ、プリコンポなど）
		if (layer instanceof AVLayer) {
			// アンカーポイントを [0, 0] に設定
			if (layer.anchorPoint !== null) {
				layer.anchorPoint.setValue([0, 0]);
			}

			// 透明度を 0% に設定
			if (layer.opacity !== null) {
				layer.opacity.setValue(0);
			}
		}
	}

	// アンドゥグループを終了
	app.endUndoGroup();
	return;
}

/*
 ボタンアクション:親ヌル追加
 */
function Nulltilities_AddParentNull() {
	var comp = app.project.activeItem;

	var layers = getActiveLayers();
	if (layers.length == 0) {
		alert("レイヤーを選択して下さい。");
		return false;
	}

	//Rigのソースとするフッテージを特定する
	var NullSourceName = "ヌル 1";
	var NullSourceItem = null;
	for(var i = 1; i <= app.project.items.length; ++i) {
		if(app.project.item(i).name == NullSourceName) {
			NullSourceItem = app.project.item(i);
			break;
		}
	}
	
	if(NullSourceItem == null) {
		alert(NullSourceName + "が見つかりません。");
		return false;
	}

	//アンドゥグループを開始する
	app.beginUndoGroup("Add Parent Null");

	// 各レイヤーに対して処理を実行する
	for (var i = 0; i < layers.length; i++) {
		var layer = layers[i];

		// 位置プロパティが存在しない場合、レイヤー作成自体をスキップする
		if (layer.position.value === null) {
			continue;
		}

		// レイヤー作成と基本プロパティを設定する
		var newNull = comp.layers.add(NullSourceItem);
		newNull.name = layer.name + "_Base";
		newNull.anchorPoint.setValue([0,0]);
		newNull.opacity.setValue(0);
		newNull.threeDLayer = layer.threeDLayer;

		// 各プロパティを設定する
		// 位置
		newNull.position.setValue(layer.position.value);

		// 回転
		if (layer.rotation.value !== null) {
			newNull.rotation.setValue(AddParentNull_Rotation_Checked ? layer.rotation.value : 0);
		}

		// スケール
		if (layer.scale.value !== null) {
			if (AddParentNull_Scale_Checked) {
				newNull.scale.setValue(layer.scale.value);
			} else {
				newNull.scale.setValue(newNull.threeDLayer ? [100,100,100] : [100,100]);
			}
		}

		// 親ヌルのレイヤー順を選択レイヤーの下層に設定する
		newNull.moveAfter(layer);
	
		// 親ヌルを選択レイヤーの親に設定する
		layer.parent = newNull;
	}

	//アンドゥグループを終了する
	app.endUndoGroup();
	return;
}
