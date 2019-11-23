<!DOCTYPE html>
<html>
  <head>
    {{#sensorType}}
      <title>Create / Update Sensor Types</title>
    {{/sensorType}}
    {{#sensor}}
      <title>Create / Update Sensors</title>
    {{/sensor}}
    <link rel="stylesheet" href="{{{base}}}/css/style.css">
  </head>
  <body>
    {{#sensorType}}
      <div class="page">
        <h1 class="tst-sensor-types-add-page">Create / Update Sensor Types</h1>
        <form method = "POST">
          {{{sensorTypeWidget}}}
          <label>&nbsp;</label><input type="submit" value="Add">
        </form>
      </div>
    {{/sensorType}}
    {{#sensor}}
      <div class="page">
        <h1 class="tst-sensors-add-page">Create / Update Sensors</h1>
        <form method = "POST">
        {{#sensorError}}
          <p></p>
          <ul>
            <li class = "error">{{sensorError}}</li>
          </ul>
        {{/sensorError}}
          {{{sensorWidget}}}
          <label>&nbsp;</label><input type="submit" value="Add">
        </form>
      </div>
    {{/sensor}}
    {{>footer}}

  </body>
</html>