/**
 * Created by Bruno Philipe on 2/1/15.
 *
 * Planetarium: Live 3D render of the solar system.
 *
 * References:
 * http://planetpixelemporium.com/planets.html (textures)
 * http://aa.quae.nl/en/reken/hemelpositie.html (positioning data)
 * http://www.met.rdg.ac.uk/~ross/Astronomy/Planets.html (positioning data)
 * http://astro.unl.edu/naap/pos/animations/kepler.html (reference)
 */
var Planetarium = (function() {
    var module = {};

    Date.prototype.getJulian = function() {
        return Math.floor((this / 86400000) - (this.getTimezoneOffset()/1440) + 2440587.5);
    }

    module.daySpan = 0;

    module.bodies = [
        {
            name: "Mercury",
            mainMesh: {
                scale: 2.4397,
                material: {
                    map: THREE.ImageUtils.loadTexture("assets/img/mercury/map1k.jpg"),
                    bumpMap: THREE.ImageUtils.loadTexture("assets/img/mercury/bump1k.jpg"),
                    bumpScale: 0.01
                }
            },
            subMeshes: [],
            orbitalElements: {
                a: 0.38710,     //mean distance
                e: 0.20563,     //eccentricity
                i: 7.00500,     //inclination
                O: 48.3310,     //Omega
                o: 29.1250,     //~omega
                M: 174.795,     //Mean anomaly
                refDate: 2451545
            }
        },{
            name: "Venus",
            mainMesh: {
                scale: 6.0518,
                material: {
                    map: THREE.ImageUtils.loadTexture("assets/img/venus/map1k.jpg"),
                    bumpMap: THREE.ImageUtils.loadTexture("assets/img/venus/bump1k.jpg"),
                    bumpScale: 0.01
                }
            },
            subMeshes: [
                {
                    scale: 6.3018,
                    material: {
                        map     : THREE.ImageUtils.loadTexture("assets/img/venus/cloudMap.jpg"),
                        side        : THREE.DoubleSide,
                        opacity     : 0.85,
                        transparent : true,
                        depthWrite  : true
                    }
                }
            ],
            orbitalElements: {
                a: 0.72333,     //mean distance
                e: 0.00677,     //eccentricity
                i: 3.39500,     //inclination
                O: 76.6800,     //Omega
                o: 54.8840,     //~omega
                M: 50.4160,     //Mean anomaly
                refDate: 2451545
            }
        },
        {
            name: "Earth",
            mainMesh: {
                scale: 6.371,
                material: {
                    map: THREE.ImageUtils.loadTexture("assets/img/earth/map1k.jpg"),
                    bumpMap: THREE.ImageUtils.loadTexture("assets/img/earth/bump1k.jpg"),
                    bumpScale: 0.01,
                    specularMap: THREE.ImageUtils.loadTexture("assets/img/earth/spec1k.jpg"),
                    specular: new THREE.Color('grey')
                }
            },
            subMeshes: [
                {
                    scale: 6.471,
                    material: {
                        map     : THREE.ImageUtils.loadTexture("assets/img/earth/cloudMap.png"),
                        side        : THREE.DoubleSide,
                        opacity     : 0.8,
                        transparent : true,
                        depthWrite  : false
                    }
                }
            ],
            orbitalElements: {
                a: 1.00000,     //mean distance
                e: 0.01671,     //eccentricity
                i: 0.00005,     //inclination
                O: 174.873,     //Omega
                o: 288.064,     //~omega
                M: 357.529,     //Mean anomaly
                refDate: 2451545
            }
        },
        {
            name: "Mars",
            mainMesh: {
                scale: 3.3895,
                material: {
                    map: THREE.ImageUtils.loadTexture("assets/img/mars/map1k.jpg"),
                    bumpMap: THREE.ImageUtils.loadTexture("assets/img/mars/bump1k.jpg"),
                    bumpScale: 0.01,
                    specularMap: THREE.ImageUtils.loadTexture("assets/img/mars/spec1k.jpg"),
                    specular: new THREE.Color('grey')
                }
            },
            subMeshes: [],
            orbitalElements: {
                a: 1.52368,     //mean distance
                e: 0.09340,     //eccentricity
                i: 1.85000,     //inclination
                O: 49.5580,     //Omega
                o: 286.502,     //~omega
                M: 19.3730,     //Mean anomaly
                refDate: 2451545
            }
        }
    ];

    module.positionForBodyWithID = function(id)
    {
        var body = this.bodies[id];
        var ob = body.orbitalElements;
        var today = new Date();
        var d2r = Math.PI/180.0;

        //mean anomaly
        var n = 0.9856076686/Math.pow(ob.a, 3.0/2.0);
        var M = ob.M + n * (today.getJulian() - ob.refDate + this.daySpan);

        //true anomaly (nu)
        var nu = trueAnomaly(ob.e, M, 10);

        //distance to sun
        var A = (ob.a * (1 - Math.pow(ob.e, 2)));
        var B = ob.e * Math.cos(nu * d2r);
        var r = A/(1 + B);

        //three-dimensional astronomical position relative to the sun
        var PosX = r * (Math.cos(ob.O * d2r) * Math.cos((ob.o + nu) * d2r) - Math.sin(ob.O * d2r) * Math.cos(ob.i * d2r) * Math.sin((ob.o + nu) * d2r));
        var PosY = r * (Math.sin(ob.O * d2r) * Math.cos((ob.o + nu) * d2r) + Math.cos(ob.O * d2r) * Math.cos(ob.i * d2r) * Math.sin((ob.o + nu) * d2r));
        var PosZ = r * Math.sin(ob.i * d2r) * Math.sin((ob.o + nu) * d2r);

        return {x: PosX, y: PosY, z: PosZ};
    }

    function trueAnomaly(ec,m,dp) {
        var pi = Math.PI;
//        var K=pi/180.0;
        var maxIter=30,i=0;
        var delta=Math.pow(10,-dp);
        var E, F;

        m=m/360.0;
        m=2.0*pi*(m-Math.floor(m));
        if (ec<0.8) E=m;else E=pi;
        F = E - ec*Math.sin(m) - m;

        while ((Math.abs(F)>delta) && (i<maxIter)) {
            E = E - F/(1.0-ec*Math.cos(E));
            F = E - ec*Math.sin(E) - m;
            i = i + 1;
        }

        return angle(ec,E,dp);

//      E=E/K;
//      return Math.round(E*Math.pow(10,dp))/Math.pow(10,dp);
    }

    function angle(ec,E,dp) {
        var K=Math.PI/180.0;
        var S=Math.sin(E);
        var C=Math.cos(E);
        var fak=Math.sqrt(1.0-ec*ec);
        var phi=Math.atan2(fak*S,C-ec)/K;
        return Math.round(phi*Math.pow(10,dp))/Math.pow(10,dp);
    }

    return module;
});