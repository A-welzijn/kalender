# A-Welzijn Kalender

v1.0.19

### Hoe het eruit ziet

![Screenshot](http://s11.postimg.org/asdwiqcwj/Capture.jpg)

### Hoe het te gebruiken

```javascript
"dependencies": {
	"awelzijn-kalender'": "latest"
 }
```
```javascript
var app = angular.module('yourApp', [
	'awelzijn.kalender'
]);
```

```html
<a-welzijn-kalender ng-show="kalenderView" activiteiten="data" gekozen-maand="maand" activiteit-detail-state="activiteit.detail" on-click="clicked(activiteit)"></a-welzijn-kalender>
```