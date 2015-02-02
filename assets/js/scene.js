/**
 * Created by Bruno on 2/1/15.
 */
var Scene = (function(){
    var module = {};

    var scene, camera, sunLight, ambientLight, renderer;
    var planetarium;
    var meshes_bodies = [];

    module.initScene = function() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.set(700,0,500);
        camera.up = new THREE.Vector3(0,0,1);
        camera.lookAt(new THREE.Vector3(0,0,0));

        sunLight = new THREE.PointLight(0xFFFFFF);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        ambientLight = new THREE.AmbientLight(0x303030);
        scene.add(ambientLight);

        renderer = new THREE.WebGLRenderer({ antialiasing: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        camera.updateProjectionMatrix();

        planetarium = new Planetarium();

        this.load();
        render();
    };

    module.load = function() {
        var geometry = new THREE.SphereGeometry(5, 32, 32);
        var material = new THREE.MeshNormalMaterial();
        var bodyMesh = new THREE.Mesh(geometry, material);
        scene.add(bodyMesh);

        geometry  = new THREE.SphereGeometry(1500, 64, 64)
        material  = new THREE.MeshBasicMaterial()
        material.map   = THREE.ImageUtils.loadTexture('assets/img/galaxy_starfield.png');
        material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
        material.map.repeat.set(8,5);
        material.side  = THREE.BackSide;

        bodyMesh  = new THREE.Mesh(geometry, material)
        scene.add(bodyMesh);

        for (var bodyID=0; bodyID<planetarium.bodies.length; ++bodyID)
        {
            var body = planetarium.bodies[bodyID];

            geometry = new THREE.SphereGeometry(body.mainMesh.scale, 32, 32);
            material = new THREE.MeshPhongMaterial(body.mainMesh.material);
            bodyMesh = new THREE.Mesh(geometry, material);
            bodyMesh.bodyID = bodyID;

            for (var subMeshID=0; subMeshID<body.subMeshes.length; ++subMeshID)
            {
                var subMeshData = body.subMeshes[subMeshID];
                geometry = new THREE.SphereGeometry(subMeshData.scale, 32, 32);
                material = new THREE.MeshPhongMaterial(subMeshData.material);
                var subMesh = new THREE.Mesh(geometry, material);
                bodyMesh.add(subMesh);
            }

            var pos = planetarium.positionForBodyWithID(bodyID);
//            console.log(pos.x * 100 + ", " + pos.y * 100 + ", " + pos.z * 100);

            scene.add(bodyMesh);
            meshes_bodies.push(bodyMesh);

            bodyMesh.position.set(pos.x * 400, pos.y * 400, pos.z * 400);
        }
    };

    var count = 0;

    var render = function() {
        requestAnimationFrame(render, null);

        count++;
        if (count==2)
        {
            count = 0;
            planetarium.daySpan++;
        }

        for (var bodyID=0; bodyID<meshes_bodies.length; ++bodyID)
        {
            var body = meshes_bodies[bodyID];
            var pos = planetarium.positionForBodyWithID(body.bodyID);
            body.position.set(pos.x * 200, pos.y * 200, pos.z * 200);
        }

        renderer.render(scene, camera);
    };

    return module;
});