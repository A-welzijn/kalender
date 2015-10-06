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
				kalenderDagen.push({ datum: dag, eersteOfLaatsteVanMaand: eersteOfLaatsteVanMaand, isVandaag: isVandaag, isBuitenBereik: (dag.getMonth() != geselecteerdeMaand.getMonth()), activiteiten: activiteiten });
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
};'use strict';
(function (module) {
	try {
		module = angular.module('awelzijn.kalender');
	} catch (e) {
		module = angular.module('awelzijn.kalender', []);
	}
	module.directive('aWelzijnKalender', ['AwelzijnKalenderService', '$timeout', '$state', function (kalenderService, $timeout, $state) {
		return {
			restrict: 'E',
			scope: {
				activiteiten: '=',
				gekozenMaand: '=',
				ngShow: '=',
				activiteitDetailState: '@',
				onClick: '=',
				toonUur: '='
			},
			replace: true,
			templateUrl: 'templates/kalender.html',
			bindToController: true,
			controllerAs: 'ctrl',
			controller: function ($scope, $element, $attrs) {
				var ctrl = this;
				var alligneerBijVolgendeShow = true;
				if (!ctrl.activiteitDetailState) { 
					ctrl.activiteitDetailState = "activiteit.detail"; 
				}
				if (!angular.isDefined($attrs.onClick)) {
					ctrl.onClick = function (activiteit) {
						$state.go(ctrl.activiteitDetailState, {id: activiteit.id});
					}
				}

				$scope.$watch("ctrl.ngShow", function (value) {
					if (value && ctrl.kalender && alligneerBijVolgendeShow) {
						$timeout(function () {
							alligneerKalender();
						});
						alligneerBijVolgendeShow = false;
					}
				});

				$scope.$watch("ctrl.activiteiten", function (value) {
					if (value) {
						ctrl.kalender = kalenderService.genereerKalender(ctrl.gekozenMaand, ctrl.activiteiten);

						if (ctrl.gekozenMaand.getMonth() === new Date().getMonth()) {
							selecteerVandaag();
						} else {
							ctrl.geselecteerdeDag = null;
						}

						if (!angular.isDefined(ctrl.ngShow) || ctrl.ngShow === true) {
							$timeout(function () {
								alligneerKalender();
							});
						} else {
							alligneerBijVolgendeShow = true;
						}
					}
				});

				ctrl.getStringWithDots = function(TheString) {

                    if (TheString.length < 16) {
                        return TheString;
                        //return padding_right(TheString, ".", 16);
                    } else {
                        var NewString = TheString.substring(0, 15);
                        return NewString + " ... ";
                    }

                }

                function padding_right(s, c, n) {
                    //if (!s || !c || s.length >= n) {
                    //    return s;
                    //}
                    var max = (n - s.length) / c.length;
                    for (var i = 0; i < max; i++) {
                        s += c;
                    }
                    s += "";
                    return s;
                }
				
				var selecteerVandaag = function () {
					var vandaag = new Date();
					vandaag.setHours(0, 0, 0, 0);
					angular.forEach(ctrl.kalender.weken, function (week) {
						angular.forEach(week, function (dag) {
							if (dag.datum.getTime() === vandaag.getTime()) {
								ctrl.geselecteerdeDag = dag;
							}
						});
					})
				};
				
				var alligneerKalender = function () {
					//zorgen dat overlappende activiteiten op dezelfde hoogte staan
					var activiteitenIds = _.pluck(ctrl.activiteiten, 'id');
					
					angular.forEach(activiteitenIds, function (id) {
						var balkskesVoorActiviteit = $('.kalender td div.' + id);
						balkskesVoorActiviteit.css("background-color", "#43A047");

						balkskesVoorActiviteit.hover(function () {
							balkskesVoorActiviteit.fadeTo(0, 0.8);
						}, function () {
							balkskesVoorActiviteit.fadeTo(0, 1);
						});

						for (var i = 0; i < balkskesVoorActiviteit.length; i++) {
							if (i > 0) {
								var huidigBalkske = angular.element(balkskesVoorActiviteit[i]);
								var vorigBalkske = angular.element(balkskesVoorActiviteit[i - 1]);

								var indexHuidigBalkske = huidigBalkske.parent().parent().index();
								var indexVorigBalkske = vorigBalkske.parent().parent().index();
								
								if (indexHuidigBalkske != 0) {
									huidigBalkske.addClass("herhaling");
								}
								
								// niet aligneren over week heen
								if (indexVorigBalkske != 6) {
									var dummyBalkske = '<div class="kalenderActiviteit" style="visibility:collapse;">dummy</div>';
									while (huidigBalkske[0].offsetTop < vorigBalkske[0].offsetTop) {
										huidigBalkske.parent().prepend(dummyBalkske);
									}
									while (vorigBalkske[0].offsetTop < huidigBalkske[0].offsetTop) {
										vorigBalkske.parent().prepend(dummyBalkske);
									}								
								}
								
							}
						}
					});
				};
			}
		};
	}]);
})();
;angular.module('awelzijn.kalender').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/kalender.html',
    "<div> <div class=kalender> <table> <thead> <tr class=placeholder ng-show=ctrl.loading> <th><center>Activiteiten laden...</center></th> </tr> <tr ng-hide=ctrl.loading> <th>ma<span>andag</span></th> <th>di<span>nsdag</span></th> <th>wo<span>ensdag</span></th> <th>do<span>nderdag</span></th> <th>vr<span>ijdag</span></th> <th>za<span>terdag</span></th> <th>zo<span>ndag</span></th> </tr> </thead> <tbody> <tr class=placeholder ng-show=ctrl.loading> <td><center><i class=\"fa fa-spinner fa-spin\"></i></center></td> </tr> <tr ng-hide=ctrl.loading ng-repeat=\"week in ctrl.kalender.weken\"> <td ng-click=\"ctrl.geselecteerdeDag = dag\" ng-repeat=\"dag in week\" ng-class=\"{'buiten_bereik': (dag.isBuitenBereik || dag.datum.getDay() == 0 || dag.datum.getDay() == 6), 'heeftActiviteiten': dag.activiteiten.length > 0, 'vandaag': dag.isVandaag, 'geselecteerdeDag': ctrl.geselecteerdeDag == dag && dag.activiteiten.length > 0}\"> <div class=datum> {{dag.datum | date:'dd'}}\n" +
    "<span class=large ng-show=dag.eersteOfLaatsteVanMaand> {{dag.datum | date:'MMMM'}}</span>\n" +
    "<span class=small ng-show=dag.eersteOfLaatsteVanMaand> {{dag.datum | date:'MMM'}}</span> </div> <div ng-if=\"dag.activiteiten.length > 0\" class=heeftActiviteiten></div> <div ng-if=dag.activiteiten class=toon-info> <div ng-click=ctrl.onClick(activiteit) ng-repeat=\"activiteit in dag.activiteiten\" class=\"kalenderActiviteit {{activiteit.id}}\"> <div><input ng-click=$event.stopPropagation(); type=checkbox ng-model=\"activiteit.checked\">{{activiteit.naam}}</div> </div> </div> </td> </tr> </tbody> </table> <div class=activiteitenPerDag ng-show=ctrl.geselecteerdeDag> <div ng-click=ctrl.onClick(activiteit) class=\"activiteit hover clearfix\" ng-repeat=\"activiteit in ctrl.geselecteerdeDag.activiteiten\"> <div ng-show=ctrl.toonUur> <input ng-click=$event.stopPropagation(); type=checkbox ng-model=activiteit.checked ng-trim=\"false\">\n" +
    "{{ctrl.getStringWithDots(activiteit.naam)}}[{htmlmin-lb}]<span class=dgpSpanKalender>{{activiteit.datumVan | date:'HH:mm'}}</span> </div> <div ng-show=!ctrl.toonUur> <input ng-click=$event.stopPropagation(); type=checkbox ng-model=activiteit.checked ng-trim=\"false\">\n" +
    "{{activiteit.naam}} </div> <div> <span class=smaller>{{activiteit.datumVan | date:'EEE dd MMM'}}</span>\n" +
    "<span>{{activiteit.datumVan | date:'HH:mm'}}</span> <div ng-show=\"activiteit.datums.length > 1\"> <span>tot</span>\n" +
    "<span class=smaller>{{activiteit.datumTot | date:'EEE dd MMM'}}</span>\n" +
    "<span>{{activiteit.datumTot | date:'HH:mm'}}</span> </div> </div> </div> </div> </div> </div>"
  );

}]);
