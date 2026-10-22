import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests'))
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
import sys
from PIL import Image
ids=sys.argv[1].split(','); vs=sys.argv[2].split(',')
S=Image.new('RGB',(600*len(ids),360*len(vs)))
for r,v in enumerate(vs):
    for c,k in enumerate(ids): S.paste(Image.open(f'/tmp/v_{k}_{v}.png').resize((600,360)),(c*600,r*360))
S.save(sys.argv[3])
