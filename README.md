# A-Welzijn Kalender

v1.0.2

### Hoe het eruit ziet

![Screenshot]()

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
<a-welzijn-kalender ng-show="kalenderView" activiteiten="data" gekozen-maand="maand"></a-welzijn-kalender>
```