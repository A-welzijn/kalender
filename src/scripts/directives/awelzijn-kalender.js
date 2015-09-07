'use strict';
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
				onClick: '&'
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
				if (!ctrl.onClick) {
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

								if (huidigBalkske.parent().parent().index() != 0) {
									huidigBalkske.addClass("herhaling");
								}

								var dummyBalkske = '<div class="kalenderActiviteit" style="visibility:collapse;">dummy</div>';
								while (huidigBalkske[0].offsetTop < vorigBalkske[0].offsetTop) {
									angular.element(huidigBalkske).parent().prepend(dummyBalkske);
								}
								while (vorigBalkske[0].offsetTop < huidigBalkske[0].offsetTop) {
									angular.element(balkskesVoorActiviteit[i - 1]).parent().prepend(dummyBalkske);
								}
							}
						}
					});
				};
			}
		};
	}]);
})();
