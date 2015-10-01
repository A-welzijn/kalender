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
				onClick: '='
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
