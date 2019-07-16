import {RawResult} from './Common';

export let results: RawResult[]=[
{"f":"aurelia-v1.3.0-keyed","b":"01_run1k","v":[379.391]},
{"f":"aurelia-v1.3.0-keyed","b":"02_replace1k","v":[243.609]},
{"f":"aurelia-v1.3.0-keyed","b":"03_update10th1k_x16","v":[757.611]},
{"f":"aurelia-v1.3.0-keyed","b":"04_select1k","v":[193.775]},
{"f":"aurelia-v1.3.0-keyed","b":"05_swap1k","v":[108.164]},
{"f":"aurelia-v1.3.0-keyed","b":"06_remove-one-1k","v":[72.264]},
{"f":"aurelia-v1.3.0-keyed","b":"07_create10k","v":[2638.084]},
{"f":"aurelia-v1.3.0-keyed","b":"08_create1k-after1k_x2","v":[762.937]},
{"f":"aurelia-v1.3.0-keyed","b":"09_clear1k_x8","v":[1080.572]},
{"f":"aurelia-v1.3.0-keyed","b":"21_ready-memory","v":[2.2386817932128906]},
{"f":"aurelia-v1.3.0-keyed","b":"22_run-memory","v":[4.827114105224609]},
{"f":"aurelia-v1.3.0-keyed","b":"23_update5-memory","v":[5.015602111816406]},
{"f":"aurelia-v1.3.0-keyed","b":"24_run5-memory","v":[5.542430877685547]},
{"f":"aurelia-v1.3.0-keyed","b":"25_run-clear-memory","v":[4.0954437255859375]},
{"f":"aurelia-v1.3.0-keyed","b":"31_startup-ci","v":[3510.536]},
{"f":"aurelia-v1.3.0-keyed","b":"32_startup-bt","v":[362.6239999999999]},
{"f":"aurelia-v1.3.0-keyed","b":"33_startup-mainthreadcost","v":[712.0999999999998]},
{"f":"aurelia-v1.3.0-keyed","b":"34_startup-totalbytes","v":[439.1103515625]},
{"f":"aurelia2-keyed","b":"01_run1k","v":[430.525]},
{"f":"aurelia2-keyed","b":"02_replace1k","v":[453.538]},
{"f":"aurelia2-keyed","b":"03_update10th1k_x16","v":[1191.358]},
{"f":"aurelia2-keyed","b":"04_select1k","v":[464.321]},
{"f":"aurelia2-keyed","b":"05_swap1k","v":[195.08]},
{"f":"aurelia2-keyed","b":"06_remove-one-1k","v":[95.784]},
{"f":"aurelia2-keyed","b":"07_create10k","v":[6599.038]},
{"f":"aurelia2-keyed","b":"08_create1k-after1k_x2","v":[1572.631]},
{"f":"aurelia2-keyed","b":"09_clear1k_x8","v":[2086.264]},
{"f":"aurelia2-keyed","b":"21_ready-memory","v":[2.165538787841797]},
{"f":"aurelia2-keyed","b":"22_run-memory","v":[8.260223388671875]},
{"f":"aurelia2-keyed","b":"23_update5-memory","v":[8.548187255859375]},
{"f":"aurelia2-keyed","b":"24_run5-memory","v":[5.906703948974609]},
{"f":"aurelia2-keyed","b":"25_run-clear-memory","v":[3.442047119140625]},
{"f":"aurelia2-keyed","b":"31_startup-ci","v":[3156.126]},
{"f":"aurelia2-keyed","b":"32_startup-bt","v":[197.04400000000004]},
{"f":"aurelia2-keyed","b":"33_startup-mainthreadcost","v":[550.3120000000001]},
{"f":"aurelia2-keyed","b":"34_startup-totalbytes","v":[359.4462890625]},
{"f":"vanillajs-keyed","b":"01_run1k","v":[242.017]},
{"f":"vanillajs-keyed","b":"02_replace1k","v":[273.154]},
{"f":"vanillajs-keyed","b":"03_update10th1k_x16","v":[820.495]},
{"f":"vanillajs-keyed","b":"04_select1k","v":[88.632]},
{"f":"vanillajs-keyed","b":"05_swap1k","v":[144.566]},
{"f":"vanillajs-keyed","b":"06_remove-one-1k","v":[95.175]},
{"f":"vanillajs-keyed","b":"07_create10k","v":[2127.237]},
{"f":"vanillajs-keyed","b":"08_create1k-after1k_x2","v":[582.568]},
{"f":"vanillajs-keyed","b":"09_clear1k_x8","v":[556.536]},
{"f":"vanillajs-keyed","b":"21_ready-memory","v":[1.1530914306640625]},
{"f":"vanillajs-keyed","b":"22_run-memory","v":[1.643646240234375]},
{"f":"vanillajs-keyed","b":"23_update5-memory","v":[1.9357948303222656]},
{"f":"vanillajs-keyed","b":"24_run5-memory","v":[2.271137237548828]},
{"f":"vanillajs-keyed","b":"25_run-clear-memory","v":[2.3921852111816406]},
{"f":"vanillajs-keyed","b":"31_startup-ci","v":[1880.2079999999999]},
{"f":"vanillajs-keyed","b":"32_startup-bt","v":[16]},
{"f":"vanillajs-keyed","b":"33_startup-mainthreadcost","v":[343.216]},
{"f":"vanillajs-keyed","b":"34_startup-totalbytes","v":[147.21484375]},];
export let frameworks = [{"name":"aurelia-v1.3.0-keyed","keyed":true},{"name":"aurelia2-keyed","keyed":true},{"name":"vanillajs-keyed","keyed":true}];
export let benchmarks = [{"id":"01_run1k","label":"create rows","description":"creating 1,000 rows","type":0},{"id":"02_replace1k","label":"replace all rows","description":"updating all 1,000 rows (5 warmup runs).","type":0},{"id":"03_update10th1k_x16","label":"partial update","description":"updating every 10th row for 1,000 rows (3 warmup runs). 16x CPU slowdown.","type":0,"throttleCPU":16},{"id":"04_select1k","label":"select row","description":"highlighting a selected row. (5 warmup runs). 16x CPU slowdown.","type":0,"throttleCPU":16},{"id":"05_swap1k","label":"swap rows","description":"swap 2 rows for table with 1,000 rows. (5 warmup runs). 4x CPU slowdown.","type":0,"throttleCPU":4},{"id":"06_remove-one-1k","label":"remove row","description":"removing one row. (5 warmup runs).","type":0},{"id":"07_create10k","label":"create many rows","description":"creating 10,000 rows","type":0},{"id":"08_create1k-after1k_x2","label":"append rows to large table","description":"appending 1,000 to a table of 10,000 rows. 2x CPU slowdown","type":0,"throttleCPU":2},{"id":"09_clear1k_x8","label":"clear rows","description":"clearing a table with 1,000 rows. 8x CPU slowdown","type":0,"throttleCPU":8},{"id":"21_ready-memory","label":"ready memory","description":"Memory usage after page load.","type":1},{"id":"22_run-memory","label":"run memory","description":"Memory usage after adding 1000 rows.","type":1},{"id":"23_update5-memory","label":"update eatch 10th row for 1k rows (5 cycles)","description":"Memory usage after clicking update every 10th row 5 times","type":1},{"id":"24_run5-memory","label":"replace 1k rows (5 cycles)","description":"Memory usage after clicking create 1000 rows 5 times","type":1},{"id":"25_run-clear-memory","label":"creating/clearing 1k rows (5 cycles)","description":"Memory usage after creating and clearing 1000 rows 5 times","type":1},{"id":"31_startup-ci","label":"consistently interactive","description":"a pessimistic TTI - when the CPU and network are both definitely very idle. (no more CPU tasks over 50ms)","type":2,"property":"TimeToConsistentlyInteractive"},{"id":"32_startup-bt","label":"script bootup time","description":"the total ms required to parse/compile/evaluate all the page's scripts","type":2,"property":"ScriptBootUpTtime"},{"id":"33_startup-mainthreadcost","label":"main thread work cost","description":"total amount of time spent doing work on the main thread. includes style/layout/etc.","type":2,"property":"MainThreadWorkCost"},{"id":"34_startup-totalbytes","label":"total kilobyte weight","description":"network transfer cost (post-compression) of all the resources loaded into the page.","type":2,"property":"TotalKiloByteWeight"}];