import numpy as np
import ntplot as ntp

x = np.asarray(range(100),dtype=np.float32)

y1 = 10 - np.exp((-x/100)**2) + np.sin(x/10*np.pi)/16
y2 = 10 - np.exp((-x/100)**2) + np.cos(x/10*np.pi)/16

x2 = x[::2]+10
y3 = 10 - np.exp((-x2/100)**2/2)+ np.cos(x2/10*np.pi)/16


plt = ntp.figure()
plt.plot(x*1000,y1,'x.y1')
plt.plot(x*1000,y2,'x.y2')
plt.plot(x2*1000,y3,'x2.y3')

plt.save('pyex.html')
