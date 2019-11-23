<!DOCTYPE html>
<html>
  <head>
    <title>Search Sensors</title>
    <link rel="stylesheet" href="{{{base}}}/css/style.css">
  </head>
  <body>
    <div class="page">
    <h1 class="tst-sensors-search-page">Search Sensors</h1>
    {{#sensorError}}
      <ul>
        <li class="error">{{sensorError}}</li>
      </ul>
    {{/sensorError}}
     <form method = "GET">
        {{{widget}}}
      <label>&nbsp;</label><input type="submit" value="search">
      </form>
    </div>
    {{#displaySummary}}
      <h2>Results Summary</h2>
      <table class = "summary">
        <thead>
          <tr>
                    <th>Sensor ID</th>
                    <th>Model</th>
                    <th>Period</th>
                    <th colspan="2">Expected Range</th>
          </tr>
          <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th>Min</th>
                    <th>Max</th>
          </tr>
        </thead>
        <tbody>
        {{#sensorData}}
          <tr>
            <td class="tst-sensor-id">{{id}}</td>
            <td class="tst-model">{{model}}</td>
            <td class="tst-period numeric">{{period}}</td>
            {{#expected}}
              <td class="numeric interval tst-expected-min">{{min}}</td>
              <td class="numeric interval tst-expected-max">{{max}}</td>
            {{/expected}}
          </tr>
        {{/sensorData}}
        </tbody>
      </table>
    {{/displaySummary}}
    <div class="scroll">
      {{#prev}}
        <a class="tst-prev" href={{prev}} rel="pev">&lt;&lt;</a>
      {{/prev}}
      {{#next}}
        <a class="tst-next" href={{next}} rel="next">&gt;&gt;</a>
      {{/next}}
    </div>
    {{>footer}}
  </body>
</html>