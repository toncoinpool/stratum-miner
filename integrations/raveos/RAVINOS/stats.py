import json
import os

import ravinos

cfg = ravinos.get_config()
stats_ravin = ravinos.get_stats()
stats_json_path = os.path.join(cfg['miner_dir'], 'data', 'stats.json')

if not os.path.isfile(stats_json_path):
    stats_ravin['shares'] = {
        'accepted': 0,
        'invalid': 0,
        'rejected': 0
    }
else:
    with open(stats_json_path) as f:
        stats_json = json.loads(f.read())

    args = ' '.join(cfg['args'] or [])
    if '-b ' in args or '--bin ' in args:
        if '-b cuda-18' in args or '--bin cuda-18' in args:
            kind = 'NVIDIA'
        elif '-b opencl-18' in args or '--bin opencl-18' in args:
            kind = 'AMD'
        else:
            kind = 'both'
    else:
        kind = 'both'

    indexes = []
    for i in range(len(stats_ravin['mpu'])):
        if (stats_ravin['mpu'][i]['type'] == 'NVIDIA'):
            if(kind == 'NVIDIA' or kind == 'both'):
                indexes.append(i)
    for i in range(len(stats_ravin['mpu'])):
        if (stats_ravin['mpu'][i]['type'] == 'AMD'):
            if(kind == 'AMD' or kind == 'both'):
                indexes.append(i)

    for i in range(len(stats_json['gpus'])):
        gpu = stats_json['gpus'][i]
        mpuIdx = indexes[i]
        mpu = stats_ravin['mpu'][mpuIdx]
        mpu['hash_rate1'] = gpu['hashrate'] * 1e6
        mpu['shares'] = {
            'accepted': gpu['accepted'],
            'invalid': gpu['invalid'],
            'rejected': gpu['duplicate'] + gpu['stale']
        }

    stats_ravin['shares'] = {
        'accepted': stats_json['ar'][0],
        'invalid': 0,
        'rejected': stats_json['ar'][1]
    }

ravinos.set_stats(stats_ravin)
