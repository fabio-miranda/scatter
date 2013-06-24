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
  def data(self, firsttime, numbinscatter, numbinhistogram, dimperimage):

    cherrypy.response.headers['Content-Type'] = "application/json;"

    numbinscatter = int(numbinscatter)
    numbinhistogram = int(numbinhistogram)
    dimperimage = int(dimperimage)
    data = {}
    data['firsttime'] = firsttime
    data['dimperimage'] = dimperimage
    numrelations = [2, 4]

    loadedAllDim = False
    count = 0
    while(loadedAllDim == False):
      data[count] = {}
      dim0 = count*dimperimage;
      dim1 = (count+1)*dimperimage;

      #scatterplot matrix
      for j in numrelations:

        f = open('./data4/'+str(j)+'_'+str(numbinscatter)+'_'+str(dim0)+'_'+str(dim1)+'.txt', 'r')
        fnumdim = f.readline()
        fdim0 = f.readline()
        fdim1 = f.readline()
        fminvalue = f.readline()
        fmaxvalue = f.readline()
        f.close()

        buffer = StringIO.StringIO()
        img = Image.open('./data4/'+str(j)+'_'+str(numbinscatter)+'_'+str(dim0)+'_'+str(dim1)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
        width = int(img.size[0])
        height = int(img.size[1])
        img.save(buffer, format='PNG')
        buffer.seek(0)

        data[count][j] = {}
        data[count][j]['data'] = base64.b64encode(buffer.getvalue())
        data[count][j]['numrelations'] = j
        data[count][j]['width'] = width
        data[count][j]['height'] = height

        data[count][j]['numdim'] = fnumdim
        data[count][j]['numbin'] = numbinscatter
        data[count][j]['dim0'] = dim0
        data[count][j]['dim1'] = dim1
        data[count][j]['minvalue'] = fminvalue
        data[count][j]['maxvalue'] = fmaxvalue


      #histogram
      f = open('./data4/hist_'+str(numbinscatter)+'_'+str(numbinhistogram)+'_'+str(dim0)+'_'+str(dim1)+'.txt', 'r')
      fnumdim = f.readline()
      fdim0 = f.readline()
      fdim1 = f.readline()
      fminvalue = f.readline()
      fmaxvalue = f.readline()
      f.close()

      buffer = StringIO.StringIO()
      img = Image.open('./data4/hist_'+str(numbinscatter)+'_'+str(numbinhistogram)+'_'+str(dim0)+'_'+str(dim1)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
      width = int(img.size[0])
      height = int(img.size[1])
      img.save(buffer, format='PNG')
      buffer.seek(0)

      data[count]['histogram'] = {}
      data[count]['histogram']['data'] = base64.b64encode(buffer.getvalue())
      data[count]['histogram']['width'] = width
      data[count]['histogram']['height'] = height
      data[count]['histogram']['numdim'] = fnumdim
      data[count]['histogram']['dim0'] = fdim0
      data[count]['histogram']['dim1'] = fdim1
      data[count]['histogram']['numbin'] = numbinhistogram
      data[count]['histogram']['minvalue'] = fminvalue
      data[count]['histogram']['maxvalue'] = fmaxvalue

      if(int(fdim1) >= int(fnumdim)):
        loadedAllDim = True
      else:
        count+=1

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
