import os

import ravinos

cfg = ravinos.get_config()

wallet = cfg['coins'][0]['pools'][0]['user']

args = ' '.join(cfg['args'])

cmd = os.path.join(cfg['miner_dir'], 'TON-Stratum-Miner') + ' --integration raveos -w %s' % wallet

if len(args) > 0:
    cmd += ' ' + args

ravinos.run(cmd)
