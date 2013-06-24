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
  def data(self, numbinscatter, numbinhistogram):

    cherrypy.response.headers['Content-Type'] = "application/json;"

    numbinscatter = int(numbinscatter)
    numbinhistogram = int(numbinhistogram)
    data = {}
    numrelations = [2, 4]

    #scatterplot matrix
    for i in numrelations:

      f = open('./data4/'+str(i)+'_'+str(numbinscatter)+'.txt', 'r')
      numdim = f.readline()
      minvalue = f.readline()
      maxvalue = f.readline()
      f.close()

      buffer = StringIO.StringIO()
      img = Image.open('./data4/'+str(i)+'_'+str(numbinscatter)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
      width = int(img.size[0])
      height = int(img.size[1])
      img.save(buffer, format='PNG')
      buffer.seek(0)

      data[i] = {}
      data[i]['data'] = base64.b64encode(buffer.getvalue())
      data[i]['numrelations'] = i
      data[i]['width'] = width
      data[i]['height'] = height
      data[i]['numdim'] = numdim
      data[i]['numbin'] = numbinscatter
      data[i]['minvalue'] = minvalue
      data[i]['maxvalue'] = maxvalue


    #histogram
    f = open('./data4/hist_'+str(numbinscatter)+'_'+str(numbinhistogram)+'.txt', 'r')
    numdim = f.readline()
    minvalue = f.readline()
    maxvalue = f.readline()
    f.close()

    buffer = StringIO.StringIO()
    img = Image.open('./data4/hist_'+str(numbinscatter)+'_'+str(numbinhistogram)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
    width = int(img.size[0])
    height = int(img.size[1])
    img.save(buffer, format='PNG')
    buffer.seek(0)

    data['histogram'] = {}
    data['histogram']['data'] = base64.b64encode(buffer.getvalue())
    data['histogram']['width'] = width
    data['histogram']['height'] = width
    data['histogram']['numdim'] = numdim
    data['histogram']['numbin'] = numbinhistogram
    data['histogram']['minvalue'] = minvalue
    data['histogram']['maxvalue'] = maxvalue

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
