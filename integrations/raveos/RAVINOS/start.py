import os

import ravinos

cfg = ravinos.get_config()
pool = cfg['coins'][0]['pools'][0]

args = ' '.join(cfg['args'])

if len(args) == 0:
    ravinos.error('--wallet argument is missing')

cmd = os.path.join(cfg['miner_dir'], 'TON-Stratum-Miner') + ' --integration raveos ' + args

ravinos.run(cmd)
