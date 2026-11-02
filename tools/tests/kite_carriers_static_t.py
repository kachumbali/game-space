#!/usr/bin/env python3
"""Verify the KITE carrier browser assertion rejects a bad launch."""
import copy
import drone_t

good = [dict(id=id, count=1, type='kite6', ctrl=True, order='protect', alive=True,
             stock=1, length=6, rails=2, missiles=2) for id in ('halberd', 'falchion')]
assert drone_t.CHK['kite_carriers'](good)
bad = copy.deepcopy(good)
bad[1]['type'] = 'drone'
assert not drone_t.CHK['kite_carriers'](bad), 'the check must detect a wrong drone hull'
print('KITE carrier assertion controls: OK')
