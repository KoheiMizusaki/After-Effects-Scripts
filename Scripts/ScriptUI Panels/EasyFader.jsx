/*
 EasyFader.jsx
 for Japanese only

 選択したレイヤーの不透明度に、指定フレーム数の長さのフェードイン/フェードアウトを適用します。

 © 2025 AQANIMATION / Kohei Mizusaki. All rights reserved.
*/

var ApplyFadeIn = true;
var FadeInFrames = 10;
var FadeInEaseIn = false;
var FadeInEaseOut = false;
var ApplyFadeOut = true;
var FadeOutFrames = 10;
var FadeOutEaseIn = false;
var FadeOutEaseOut = false;

(function (thisObj) {

	thisObj.orientation = "column";
	thisObj.alignChildren = ["left", "top"];

	// FadeIn設定
	var group = thisObj.add("group");
	group.orientation = "row";
	group.alignChildren = ["left", "center"];

	var ApplyFadeInCheck = group.add("checkbox", undefined, "In");
	ApplyFadeInCheck.value = ApplyFadeIn;
	ApplyFadeInCheck.onClick = function() {
		ApplyFadeIn = this.value;
	}

	group.add("statictext", undefined, "フレーム数");
	var FadeInFramesInput = group.add("edittext", undefined, FadeInFrames);
	FadeInFramesInput.characters = 3;
	FadeInFramesInput.onChange = function () {
		FadeInFrames = this.text;
	}

	var FadeInEaseInCheck = group.add("checkbox", undefined, "イーズイン");
	FadeInEaseInCheck.value = FadeInEaseIn;
	FadeInEaseInCheck.onClick = function() {
		FadeInEaseIn = this.value;
	}

	var FadeInEaseOutCheck = group.add("checkbox", undefined, "イーズアウト");
	FadeInEaseOutCheck.value = FadeInEaseOut;
	FadeInEaseOutCheck.onClick = function() {
		FadeInEaseOut = this.value;
	}

	// FadeOut設定
	var group = thisObj.add("group");
	group.orientation = "row";
	group.alignChildren = ["left", "center"];

	var ApplyFadeOutCheck = group.add("checkbox", undefined, "Out");
	ApplyFadeOutCheck.value = ApplyFadeOut;
	ApplyFadeOutCheck.onClick = function() {
		ApplyFadeOut = this.value;
	}

	group.add("statictext", undefined, "フレーム数");
	var FadeOutFramesInput = group.add("edittext", undefined, FadeOutFrames);
	FadeOutFramesInput.characters = 3;
	FadeOutFramesInput.onChange = function () {
		FadeOutFrames = this.text;
	}

	var FadeOutEaseInCheck = group.add("checkbox", undefined, "イーズイン");
	FadeOutEaseInCheck.value = FadeOutEaseIn;
	FadeOutEaseInCheck.onClick = function() {
		FadeOutEaseIn = this.value;
	}

	var FadeOutEaseOutCheck = group.add("checkbox", undefined, "イーズアウト");
	FadeOutEaseOutCheck.value = FadeOutEaseOut;
	FadeOutEaseOutCheck.onClick = function() {
		FadeOutEaseOut = this.value;
	}

	// UIリサイズ
	ApplyFadeInCheck.preferredSize = ApplyFadeOutCheck.preferredSize;

	// 実行ボタン
	var group = thisObj.add("group");
	group.alignChildren = ["fill", "top"];
	var btn = group.add("button", undefined, "実行");
	btn.onClick = function () { EasyFader(); return; };
	
	// サイズ変更に対応
	thisObj.layout.layout(true);
	thisObj.layout.resize();
	thisObj.onResizing = thisObj.onResize = function () { this.layout.resize(); };

})(this);

function EasyFader()
{
	var comp = app.project.activeItem;
 
	if((comp === null) || !(comp instanceof CompItem)) {
		alert("コンポジションを開いて下さい。");
		return false;
	}

	var layers = comp.selectedLayers;
	if (layers.length == 0 || layers[0] == null) {
		alert("レイヤーを選択してから実行して下さい。");
		return false;
	}

	var frameDuration = comp.frameDuration;
	var easeIn = new KeyframeEase(0, 33);
	var easeOut = new KeyframeEase(0, 33);

	// アンドゥグループを開始
	app.beginUndoGroup("Easy Fader");

	// レイヤーごとに処理を実行する
	for (var i = 0; i < layers.length; ++i) {
		var layer = layers[i];
		var opacity = layer.property("ADBE Transform Group").property("ADBE Opacity");

		// フェードイン
		if (ApplyFadeIn) {
			var inStart = layer.inPoint;
			var inEnd = inStart + (FadeInFrames * frameDuration);
			var inOpacity = layer.opacity.valueAtTime(inStart, false);

			opacity.setValueAtTime(inStart, 0);
			opacity.setValueAtTime(inEnd, inOpacity);
		}

		// フェードアウト
		if (ApplyFadeOut) {
			var outEnd = layer.outPoint - frameDuration;
			var outStart = outEnd - (FadeOutFrames * frameDuration);
			var outOpacity = layer.opacity.valueAtTime(outEnd, false);

			opacity.setValueAtTime(outStart, outOpacity);
			opacity.setValueAtTime(outEnd, 0);
		}

		// イージング設定
		if (ApplyFadeIn) {
			if (FadeInEaseIn || FadeInEaseOut) {
				var k1 = opacity.nearestKeyIndex(inStart);
				var k2 = opacity.nearestKeyIndex(inEnd);

				if (FadeInEaseIn)  opacity.setTemporalEaseAtKey(k1, [easeIn], [easeIn]);
				if (FadeInEaseOut) opacity.setTemporalEaseAtKey(k2, [easeOut], [easeOut]);
			}
		}

		if (ApplyFadeOut) {
			if (FadeOutEaseIn || FadeOutEaseOut) {
				var k3 = opacity.nearestKeyIndex(outStart);
				var k4 = opacity.nearestKeyIndex(outEnd);

				if (FadeOutEaseIn)  opacity.setTemporalEaseAtKey(k3, [easeIn], [easeIn]);
				if (FadeOutEaseOut) opacity.setTemporalEaseAtKey(k4, [easeOut], [easeOut]);
			}
		}
	}

	app.endUndoGroup();
}
