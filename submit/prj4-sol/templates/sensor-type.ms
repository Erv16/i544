<!DOCTYPE html>
<html>
  <head>
    <title>Search Sensor Types</title>
    <link rel="stylesheet" href="{{{base}}}/css/style.css">
  </head>
  <body>
    <div class = "page">
      <h1 class="tst-sensor-types-search-page">Search Sensor Types</h1>
      <form method = "GET">
        {{#sensorTypeError}}
         <p></p>
        <ul>
          <li class="error">{{sensorTypeError}}</li>
        </ul>
        {{/sensorTypeError}}
        {{{widget}}}
      <label>&nbsp;</label><input type="submit" value="Search">
      </form>
    </div>
    {{#displaySummary}}
      <h2>Results Summary</h2>
      <table class = "summary">
        <thead>
          <tr>
                    <th>Manufacturer</th>
                    <th>Sensor Type ID</th>
                    <th>Model Number</th>
                    <th>Quantity</th>
                    <th colspan="2">Limits</th>
          </tr>
          <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th>Min</th>
                    <th>Max</th>
          </tr>
        </thead>
        <tbody>
        {{#sensorTypeData}}
          <tr>
            <td class="tst-maufacturer">{{manufacturer}}</td>
            <td class="tst-sensor-type-id">{{id}}</td>
            <td class="tst-model-number">{{modelNumber}}</td>
            <td class="tst-quantity">{{quantity}}</td>
            {{#limits}}
              <td class="numeric interval tst-limits-min">{{min}}</td>
              <td class="numeric interval tst-limits-max">{{max}}</td>
            {{/limits}}
          </tr>
        {{/sensorTypeData}}
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