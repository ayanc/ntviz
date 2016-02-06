x = [0:99];
y1 = 10 - exp((-x/100).^2) + sin(x/10*pi)/16;
y2 = 10 - exp((-x/100).^2) + cos(x/10*pi)/16;

x2 = x(1:2:end)+10;
y3 = 10 - exp((-x2/100).^2/2)+ cos(x2/10*pi)/16;


plt = ntfigure();
plt.plot(x*1000,y1,'x.y1');
plt.plot(x*1000,y2,'x.y2');
plt.plot(x2*1000,y3,'x2.y3');
plt.save('matex.html');
