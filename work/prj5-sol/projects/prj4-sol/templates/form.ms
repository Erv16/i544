<form method="{{{method}}}" {{#action}}action="{{action}}"{{/action}}>
{{#errors.length}}
<p></p>
<ul>
  {{#errors}}<li class="error">{{.}}</li>{{/errors}}
</ul>
{{/errors.length}}
{{#widgets}}{{>widget}}{{/widgets}}
<label>&nbsp;</label><input type="submit" value="{{viewId}}">
</form>
