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

    args = ' '.join(cfg['args'])
    if '-b ' in args and '-b opencl-18' in args:
        kind = 'AMD'
    elif '--bin ' in args and '--bin opencl-18' in args:
        kind = 'AMD'
    else:
        kind = 'NVIDIA'

    for mpu in stats_ravin['mpu']:
        if (len(stats_json['hs']) == 0):
            break

        if (mpu['type'] != kind):
            continue

        hs = stats_json['hs'].pop(0)
        mpu['hash_rate1'] = hs * 1e6

    stats_ravin['shares'] = {
        'accepted': stats_json['ar'][0],
        'invalid': 0,
        'rejected': stats_json['ar'][1]
    }

ravinos.set_stats(stats_ravin)
