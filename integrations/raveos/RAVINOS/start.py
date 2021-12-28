import os

import ravinos

cfg = ravinos.get_config()

wallet = cfg['coins'][0]['pools'][0]['user']

cmd = os.path.join(cfg['miner_dir'], 'TON-Stratum-Miner') + ' --integration raveos -w %s' % wallet

args = ' '.join(cfg['args'] or [])

if len(args) > 0:
    cmd += ' ' + args

ravinos.run(cmd)
