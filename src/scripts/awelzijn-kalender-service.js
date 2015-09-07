'use strict';
(function (module) {
	try {
		module = angular.module('awelzijn.kalender');
	} catch (e) {
		module = angular.module('awelzijn.kalender', []);
	}
	module.factory('AwelzijnKalenderService', [function () {
		var getDagenInMaand = function (jaar, maand) {
			var dagen = [];
			var laatsteDagInMaand = new Date(jaar, maand + 1, 0).getDate();
			for (var i = 0; i < laatsteDagInMaand; i++) {
				dagen.push(new Date(jaar, maand, i + 1));
			}
			return dagen;
		};

		function getDatesInRange(start, end) {
			start = new Date(start);
			start.setHours(0, 0, 0, 0);
			end = new Date(end);
			var dates = [];
			while (start <= end) {
				dates.push(start);
				start = start.addDays(1);
			}
			return dates;
		}

		var genereerDagen = function (geselecteerdeMaand) {
			var huidigeMaand = new Date(geselecteerdeMaand);
			var dagenInHuidigeMaand = getDagenInMaand(huidigeMaand.getFullYear(), huidigeMaand.getMonth());

			var vorigeMaand = new Date(huidigeMaand.setMonth(huidigeMaand.getMonth() - 1));
			var dagenInVorigeMaand = getDagenInMaand(vorigeMaand.getFullYear(), vorigeMaand.getMonth());

			var volgendeMaand = new Date(vorigeMaand.setMonth(vorigeMaand.getMonth() + 2));
			var dagenInVolgendeMaand = getDagenInMaand(volgendeMaand.getFullYear(), volgendeMaand.getMonth());

			var eersteDagVanDeMaand = 7;
			if (dagenInHuidigeMaand[0].getDay() != 0) { eersteDagVanDeMaand = dagenInHuidigeMaand[0].getDay(); }

			//dagen bijvoegen als de eerste dag geen maandag is
			dagenInVorigeMaand.splice(0, dagenInVorigeMaand.length - (eersteDagVanDeMaand - 1));
			Array.prototype.push.apply(dagenInVorigeMaand, dagenInHuidigeMaand);
			dagenInHuidigeMaand = dagenInVorigeMaand;

			//dagen toevoegen als de laatste dag geen zondag is
			while (dagenInHuidigeMaand.length % 7 != 0) {
				dagenInHuidigeMaand.push(dagenInVolgendeMaand[0]);
				dagenInVolgendeMaand.splice(0, 1);
			}

			return dagenInHuidigeMaand;
		};
		
		function _genereerKalender(gekozenMaand, activiteitenLijst) {
			//datums berekenen tussen begin- en einddatum
			angular.forEach(activiteitenLijst, function (activiteit) {
				activiteit.datums = getDatesInRange(activiteit.datumVan, activiteit.datumTot);
			});

			var geselecteerdeMaand = new Date(gekozenMaand.getFullYear(), gekozenMaand.getMonth(), 1);
			var dagenInHuidigeMaand = genereerDagen(geselecteerdeMaand);
			var kalenderMaand = { weken: [] };
			var kalenderDagen = [];
			
			
			var vandaag = new Date();
			vandaag.setHours(0, 0, 0, 0);

			var dagVanDeWeek = 0;
			angular.forEach(dagenInHuidigeMaand, function (dag) {
				var activiteiten = [];
				angular.forEach(activiteitenLijst, function (activiteit) {
					for (var i = 0; i < activiteit.datums.length; i++) {
						if (dag.getTime() == activiteit.datums[i].getTime()) {
							activiteiten.push(activiteit);
						}
					}
				});
				var eersteOfLaatsteVanMaand = dag.getDate() === 1 || isLaatsteDag(dag);
				var isVandaag = dag.getTime() == vandaag.getTime();
				kalenderDagen.push({ datum: dag, eersteOfLaatsteVanMaand: eersteOfLaatsteVanMaand, vandaag: isVandaag, isBuitenBereik: (dag.getMonth() != geselecteerdeMaand.getMonth()), activiteiten: activiteiten });
				dagVanDeWeek++;
				if (dagVanDeWeek % 7 == 0) {
					kalenderMaand.weken.push(kalenderDagen);
					kalenderDagen = [];
				}
			});

			return kalenderMaand;
		};

		var isLaatsteDag = function (dt) {
			var test = new Date(dt.getTime());
			test.setDate(test.getDate() + 1);
			return test.getDate() === 1;
		}

		return {
			genereerKalender: _genereerKalender
		};
	}]);
})();

Date.prototype.addDays = function (days) {
	var dat = new Date(this.valueOf());
	dat.setDate(dat.getDate() + days);
	return dat;
}