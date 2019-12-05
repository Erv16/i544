{{#summary}}
<h2>Results Summary</h2>

<table class="summary">
    <thead>
        {{#summary.headers}}
	   <tr>
	    {{#.}}
              <th{{#span}} colspan="{{span}}"{{/span}}>{{heading}}</th>
	    {{/.}}
	   </tr>
        {{/summary.headers}}
     </thead>
     <tbody>
         {{#summary.data}}
             <tr>
                 {{#.}}
                     <td{{#span}} colspan="{{span}}"{{/span}}
		        {{#classes}} class="{{classes}}"{{/classes}}>
		       {{value}}
		     </td>
                 {{/.}}
           </tr>
         {{/summary.data}}
     </tbody>
</table>

<div class="scroll">
{{#prev}}
<a class="tst-prev" href="{{prev}}" rel="prev">&lt;&lt;</a>
{{/prev}}
{{#next}}
<a class="tst-next" href="{{next}}" rel="next">&gt;&gt;</a>
{{/next}}
</div>

{{/summary}}
