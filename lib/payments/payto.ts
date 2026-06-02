export function costAU(v,a){const n=Math.ceil(v/a),s=Math.round((v*0.017+n*0.3)*100)/100;return{payto:0,stripe:s,save:s};}
