import {cpSync,mkdirSync,rmSync} from 'node:fs';
rmSync('dist',{recursive:true,force:true});mkdirSync('dist',{recursive:true});cpSync('web','dist',{recursive:true});
console.log('Built static OpenDroid Studio in dist/');
