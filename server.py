from PIL import Image
import StringIO
import cherrypy
import json
import os
import numpy
import base64


HTML_DIR = os.path.join(os.path.abspath("."), u"html")
class ScatterPage:
  @cherrypy.expose
  def index(self):
    return open(os.path.join(HTML_DIR, u'index.html')) 

  @cherrypy.expose
  def info(self):

    cherrypy.response.headers['Content-Type'] = "application/json;"

    data = {}
    data['dim1'] = 16
    data['dim2'] = 16

    return json.dumps(data)

  @cherrypy.expose
  def data(self, numbin):

    numbin = int(numbin)

    cherrypy.response.headers['Content-Type'] = "application/json;"

    buffer = StringIO.StringIO()
    img = Image.open('./data4/2_'+str(numbin)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
    imgsize = int(img.size[0])
    img.save(buffer, format='PNG')
    buffer.seek(0)

    data = {}
    data['data'] = base64.b64encode(buffer.getvalue())
    data['numdatatiledim'] = 2
    data['imgsize'] = imgsize
    data['numdim'] = imgsize / numbin
    data['numbin'] = numbin

    return json.dumps(data)


  index.expose = True

  @cherrypy.expose
  def dataold(self, i, j, dim1, dim2):

    cherrypy.response.headers['Content-Type'] = "application/json;"

    buffer = StringIO.StringIO()
    img = Image.open('./data/'+str(dim1)+'.'+str(dim2)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
    img.save(buffer, format='PNG')
    buffer.seek(0)

    data = {}
    data['data'] = base64.b64encode(buffer.getvalue())
    data['i'] = i
    data['j'] = j
    data['dim1'] = dim1
    data['dim2'] = dim2

    return json.dumps(data)


  index.expose = True



config = os.path.join(os.path.dirname(__file__), 'config.conf')

if __name__ == '__main__':
    # CherryPy always starts with app.root when trying to map request URIs
    # to objects, so we need to mount a request handler root. A request
    # to '/' will be mapped to HelloWorld().index().
    cherrypy.quickstart(ScatterPage(), config=config)
else:
    # This branch is for the test suite; you can ignore it.
    cherrypy.tree.mount(ScatterPage(), config=config)
