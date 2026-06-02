export function costCA(v,a){const n=Math.ceil(v/a),s=Math.round((v*0.029+n*0.3)*100)/100,i=Math.round(n*0.25*100)/100;return{interac:i,stripe:s,save:Math.round((s-i)*100)/100};}
