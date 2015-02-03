/**
 * Created by Bruno on 2/1/15.
 */
var Scene = (function(){
    var module = {};

    var canvas;
    var scene, camera, sunLight, ambientLight, renderer;
    var planetarium;
    var origin;
    var meshes_bodies = [];
    var meshes_orbitPaths = [];

    var width, height;

    module.enableLabels = false;

    module.initScene = function() {
        scene = new THREE.Scene();

        width = window.innerWidth;
        height = window.innerHeight;
        origin = new THREE.Vector3(0,0,0);

//      camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 100000);
//      camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 100000);
        camera = new THREE.CombinedCamera(width, height, 60, 1, 200000, -200000, 200000);

//        camera.position.set(3000,-10000,900);
        camera.position.set(0,0,50000);
        camera.up = new THREE.Vector3(0,0,1);
        camera.lookAt(origin);

        sunLight = new THREE.PointLight(0xFFFFFF);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        ambientLight = new THREE.AmbientLight(0xAAAAAA);
        scene.add(ambientLight);

        renderer = new THREE.WebGLRenderer({
            antialiasing: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);

        canvas = renderer.domElement;
//        alert(canvas.cssText );
        canvas.style.cssText += "position: absolute; top:0; left:0;";

        document.body.appendChild(canvas);

//        camera.toOrthographic();

        planetarium = new Planetarium(camera);

        configureCanvas(canvas, width, height);

        this.load();
        render();
    };

    module.load = function() {
        var d2r = Math.PI/180.0;

        var bgGeometry  = new THREE.SphereGeometry(100000, 64, 64);
        var bgMaterial  = new THREE.MeshBasicMaterial();
        bgMaterial.map   = THREE.ImageUtils.loadTexture('assets/img/galaxy_starfield.png');
        bgMaterial.map.wrapS = bgMaterial.map.wrapT = THREE.RepeatWrapping;
        bgMaterial.map.repeat.set(8,5);
        bgMaterial.side  = THREE.BackSide;
        var bgMesh  = new THREE.Mesh(bgGeometry, bgMaterial);
        scene.add(bgMesh);

        for (var bodyID=0; bodyID<planetarium.bodies.length; ++bodyID)
        {
            var body = planetarium.bodies[bodyID];

            var geometry = body.mainMesh.geometry;
            var material = body.mainMesh.material;
            var bodyMesh = new THREE.Mesh(geometry, material);
            bodyMesh.bodyID = bodyID;
            bodyMesh.rotationPeriod = body.rotationPeriod;

            for (var subMeshID=0; subMeshID<body.subMeshes.length; ++subMeshID)
            {
                var subMeshData = body.subMeshes[subMeshID];
                var subMesh = new THREE.Mesh(subMeshData.geometry, subMeshData.material);

                bodyMesh.add(subMesh);
            }

            if (module.enableLabels)
            {
                var labelGeometry = new THREE.PlaneGeometry(1,0.2);
                var labelMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
                var labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
                labelMesh.position.set(100, 100, 100);
                bodyMesh.add(subMesh);
            }

            if (bodyID > 0)
            {
                bodyMesh.scale.set(5, 5, 5);

                var orbitMaterial = new THREE.LineBasicMaterial({
                    color: 0x0000ff,
                    lineWidth: 5
                });
                var orbitPoints = planetarium.pointsForOrbitOfBodyWithID(bodyID);
                var orbitGeometry = new THREE.Geometry();

                function addPoint(point, geometry, skipAU)
                {
                    if (!skipAU)
                    {
                        point.x *= planetarium.AU;
                        point.y *= planetarium.AU;
                        point.z *= planetarium.AU;
                    }
                    geometry.vertices.push(point);
                }

                for (var p=0; p<orbitPoints.length; p++)
                {
                    addPoint(orbitPoints[p], orbitGeometry, false);
                }
                addPoint(orbitPoints[0], orbitGeometry, true);

                var orbitMesh = new THREE.Line(orbitGeometry, orbitMaterial, THREE.LineStrip);
                scene.add(orbitMesh);
            }

            var pos = planetarium.positionForBodyWithID(bodyID, planetarium.daySpan);
//            console.log(pos.x * 100 + ", " + pos.y * 100 + ", " + pos.z * 100);

            scene.add(bodyMesh);
            meshes_bodies.push(bodyMesh);

            bodyMesh.position.set(pos.x * planetarium.AU, pos.y * planetarium.AU, pos.z * planetarium.AU);
            bodyMesh.rotateOnAxis(new THREE.Vector3(1.0,0.0,0),90 * d2r);
        }
    };

    var count = 0;

    var render = function() {
        requestAnimationFrame(render, null);

        const daysPassed = 0.25;

        planetarium.daySpan+=daysPassed;

        if (count < 2240)
        {
            camera.position.set(count < 100 ? count * 15 : count * 15 - count * 10,0,50000 - count * 20);
            camera.lookAt(origin);

            count++;
        }

        for (var bodyID=0; bodyID<meshes_bodies.length; ++bodyID)
        {
            var body = meshes_bodies[bodyID];
//            if (bodyID==3)
//            {
//                camera.lookAt(body.position);
//            }
            var pos = planetarium.positionForBodyWithID(body.bodyID, planetarium.daySpan);
            body.position.set(pos.x * planetarium.AU, pos.y * planetarium.AU, pos.z * planetarium.AU);
            body.rotation.y += body.rotationPeriod * daysPassed;
        }

        renderer.render(scene, camera);
    };

    function configureCanvas(canvas, width, height)
    {
//        var devicePixelRatio = window.devicePixelRatio || 1;
//
//        canvas.style.width = width + "px";
//        canvas.style.height = height + "px";
//
//        canvas.width = width * devicePixelRatio;
//        canvas.height = height * devicePixelRatio;
    }

    return module;
});