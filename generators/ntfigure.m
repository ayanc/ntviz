% Output time-series plots as ntviz visualization html files.
% Ayan Chakrabarti <ayanc@ttic.edu>
classdef ntfigure < handle

properties
  data
end

methods

function self = ntfigure
self.data = {};
end
   
function self = plot(self,x,y,lbl)

x = single(x(:)); y=single(y(:));
if length(x) ~= length(y)
  error('First two arguments must be of the same size');
end;

ex=false;
for i = 1:length(self.data)
  if length(x) < length(self.data{i}.it)
    if max(abs(self.data{i}.it(1:length(x)) - x)) < 1e-8
      self.data{i}.val{end+1} = y;
      self.data{i}.lbls{end+1} = lbl;
      ex=true;
      break
    end
  else
    if max(abs(self.data{i}.it - x(1:length(self.data{i}.it)))) < 1e-8
      self.data{i}.it = x;
      self.data{i}.val{end+1} = y;
      self.data{i}.lbls{end+1} = lbl;
      ex=true;
      break
    end
  end;
end

if ~ex
  nob = struct;
  nob.it = x;
  nob.val = {y};
  nob.lbls = {lbl};
  self.data{end+1} = nob;
end

end

function self = save(self,filename)

npath=getenv('NTVPATH');
if length(npath) == 0
  npath='https://ayanc.github.io/ntviz/';
end;

fid=fopen(filename,'wt');
fprintf(fid,[...
    '<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" '...
    'href="' npath 'ntviz.css">\n<script ' ...
    'src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.14/d3.min.js">'...
    '</script></head><body><div id=''graph''></div>\n<script>data=[' ]);

for i = 1:length(self.data)
  fprintf(fid,serialize_(self.data{i}));
end;
fprintf(fid,'];\n');

fprintf(fid,[ '</script><script src="'  ...
	      npath 'ntviz.js"></script></body></html>']);

fclose(fid);
end

end % Ends methods

end % Ends classdef

function s = fmt_(x)

if x == 0
  s='0'; return;
end;
s = num2str(x);
if length(strfind(s,'.')) > 0
  return;
end;
[t1,t2,gp] = regexp(s,'(.*[^0])(0*)$');
gp = gp{1}(1,2);
if length(s)-gp>=3
  s=[s(1:gp)  'e' num2str(length(s)-gp)];
end;

end

function s = serialize_(nob)

s = '{it:[';
for i = 1:length(nob.it)
  s = [s  fmt_(nob.it(i)) ','];
end;
s=[s '],val:['];
for i = 1:length(nob.val)
  s=[s '['];
  for j = 1:length(nob.val{i})
    s=[s fmt_(nob.val{i}(j)) ','];
  end;
  s=[s '],'];
end;
s=[s '],lbls:['];
for i = 1:length(nob.lbls)
  s=[s '''' nob.lbls{i} ''','];
end;
s = [s '],},'];

end