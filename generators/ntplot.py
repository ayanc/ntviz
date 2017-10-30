# Output time-series plots as ntviz visualization html files.
# Ayan Chakrabarti <ayanc@ttic.edu>

import numpy as np
import re
import os

NTVPATH=os.getenv('NTVPATH','https://ayanc.github.io/ntviz/')

htpfx='''
<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="$NTVPATHntviz.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.14/d3.min.js"></script></head><body><div id='graph'></div>
<script>
'''.lstrip().rstrip().replace('$NTVPATH',NTVPATH)

htsfx='''
</script><script src="$NTVPATHntviz.js"></script></body></html>
'''.lstrip().rstrip().replace('$NTVPATH',NTVPATH)

class ntobj:
    def serialize(self):
        s='{it:['

        for i in range(len(self.it)):
            s = s + str(self.it[i]) + ','

        s=s+'],val:['
        for i in range(len(self.val)):
            s = s+'['+','.join(['%.5f'%float(v) for v in self.val[i]])+'],'
        s=s+'],lbls:['

        for i in range(len(self.lbls)):
            s=s+"'"+self.lbls[i]+"',"
        s=s+'],},'

        return s

class figure:
    def __init__(self):
        self.data = []

    def plot(self,x,y,label):

        x = np.asarray(x,dtype=np.float32).flatten().copy()
        y = np.asarray(y,dtype=np.float32).flatten().copy()
        
        assert(len(x) == len(y))
        assert(type(label) == str)

        exist=False
        # Check to see if we can add to existing object
        for i in range(len(self.data)):

            if len(self.data[i].it) > len(x):
                if np.allclose(self.data[i].it[:len(x)],x):
                    self.data[i].val.append(y.copy())
                    self.data[i].lbls.append(label)
                    exist=True
                    break
            else:
                if np.allclose(self.data[i].it,x[:len(self.data[i].it)]):
                    self.data[i].it = x.copy()
                    self.data[i].val.append(y.copy())
                    self.data[i].lbls.append(label)
                    exist=True
                    break
        
        if not exist:
            nobj = ntobj()
            nobj.it = x.copy()
            nobj.val = [y.copy()]
            nobj.lbls = [label]
            self.data.append(nobj)

    def save(self,filename):
        with open(filename,'w') as f:
            f.write(htpfx)
            f.write("data=[")
            for i in range(len(self.data)):
                f.write(self.data[i].serialize())
            f.write("];\n")
            f.write(htsfx)
