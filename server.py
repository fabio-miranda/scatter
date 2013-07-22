from PIL import Image
import logging
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
  def index(self, datapath):
    return open(os.path.join(HTML_DIR, u'index.html'))

  # @cherrypy.expose
  # def info(self):

  #   cherrypy.response.headers['Content-Type'] = "application/json;"

  #   data = {}
  #   data['dim1'] = 16
  #   data['dim2'] = 16

  #   return json.dumps(data)

  @cherrypy.expose
  def getCountDataTile(self, datapath, numbinscatter, i, j):
    cherrypy.response.headers['Content-Type'] = "application/json;"

    data = {}

    f = open(datapath+'/info.txt', 'r')
    numentries = int(f.readline().split(':')[1])
    numdim = int(f.readline().split(':')[1])

    f = open(datapath+'/b'+str(numbinscatter)+'_i'+str(i)+'_j'+str(j)+'_k0.info.txt', 'r')
    minCountValue = float(f.readline().split(':')[1])
    maxCountValue = float(f.readline().split(':')[1])
    minIndexValue = float(f.readline().split(':')[1])
    maxIndexValue = float(f.readline().split(':')[1])
    minEntriesValue = float(f.readline().split(':')[1])
    maxEntriesValue = float(f.readline().split(':')[1])

    buffer = StringIO.StringIO()
    img = Image.open(datapath+'/b'+str(numbinscatter)+'_i'+str(i)+'_j'+str(j)+'.count.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
    width = int(img.size[0])
    height = int(img.size[1])
    img.save(buffer, format='PNG')
    buffer.seek(0)

    index = str(i)+' '+str(j)
    data['type'] = 'count'
    data['index'] = index
    data['data'] = base64.b64encode(buffer.getvalue())
    data['width'] = width
    data['height'] = height

    data['numentries'] = numentries
    data['numdim'] = numdim
    data['numbin'] = numbinscatter
    data['dim0'] = i
    data['dim1'] = j
    data['minvalue'] = minCountValue
    data['maxvalue'] = maxCountValue


    return json.dumps(data)


  @cherrypy.expose
  def getIndexDataTile(self, datapath, numbinscatter, i, j):
    cherrypy.response.headers['Content-Type'] = "application/json;"

    data = {}

    f = open(datapath+'/info.txt', 'r')
    numentries = int(f.readline().split(':')[1])
    numdim = int(f.readline().split(':')[1])

    f = open(datapath+'/b'+str(numbinscatter)+'_i'+str(i)+'_j'+str(j)+'_k0.info.txt', 'r')
    minCountValue = float(f.readline().split(':')[1])
    maxCountValue = float(f.readline().split(':')[1])
    minIndexValue = float(f.readline().split(':')[1])
    maxIndexValue = float(f.readline().split(':')[1])
    minEntriesValue = float(f.readline().split(':')[1])
    maxEntriesValue = float(f.readline().split(':')[1])

    buffer = StringIO.StringIO()
    img = Image.open(datapath+'/b'+str(numbinscatter)+'_i'+str(i)+'_j'+str(j)+'.index.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
    width = int(img.size[0])
    height = int(img.size[1])
    img.save(buffer, format='PNG')
    buffer.seek(0)

    index = str(i)+' '+str(j)
    data['type'] = 'index'
    data['index'] = index
    data['data'] = base64.b64encode(buffer.getvalue())
    data['width'] = width
    data['height'] = height

    data['numentries'] = numentries
    data['numdim'] = numdim
    data['numbin'] = numbinscatter
    data['dim0'] = i
    data['dim1'] = j
    data['minvalue'] = minIndexValue
    data['maxvalue'] = maxIndexValue


    return json.dumps(data)

  @cherrypy.expose
  def getEntryDataTile(self, datapath, numbinscatter, i, j, k):
    cherrypy.response.headers['Content-Type'] = "application/json;"

    data = {}

    f = open(datapath+'/info.txt', 'r')
    numentries = int(f.readline().split(':')[1])
    numdim = int(f.readline().split(':')[1])

    f = open(datapath+'/b'+str(numbinscatter)+'_i'+str(i)+'_j'+str(j)+'_k'+str(k)+'.info.txt', 'r')
    minCountValue = float(f.readline().split(':')[1])
    maxCountValue = float(f.readline().split(':')[1])
    minIndexValue = float(f.readline().split(':')[1])
    maxIndexValue = float(f.readline().split(':')[1])
    minEntriesValue = float(f.readline().split(':')[1])
    maxEntriesValue = float(f.readline().split(':')[1])

    buffer = StringIO.StringIO()
    img = Image.open(datapath+'/b'+str(numbinscatter)+'_i'+str(i)+'_j'+str(j)+'_k'+str(k)+'.entry.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
    width = int(img.size[0])
    height = int(img.size[1])
    img.save(buffer, format='PNG')
    buffer.seek(0)

    index = str(i)+' '+str(j)+' '+str(k)
    data['type'] = 'entry'
    data['index'] = index
    data['data'] = base64.b64encode(buffer.getvalue())
    data['width'] = width
    data['height'] = height

    data['numentries'] = numentries
    data['numdim'] = numdim
    data['numbin'] = numbinscatter
    data['dim0'] = i
    data['dim1'] = j
    data['minvalue'] = minEntriesValue
    data['maxvalue'] = maxEntriesValue


    return json.dumps(data)


  # @cherrypy.expose
  # def getDataTile2D(self, datapath, firsttime, numbinscatter, i, j):
  #   cherrypy.response.headers['Content-Type'] = "application/json;"

  #   numbinscatter = int(numbinscatter)
  #   data = {}
  #   data['firsttime'] = firsttime

  #   f = open(datapath+'/info.txt', 'r')
  #   numentries = int(f.readline())
  #   numdim = int(f.readline())
  #   dimperimage = int(f.readline())
  #   f.close()

  #   #2D
  #   index = str(i)+' '+str(j)
  #   f = open(datapath+'/2_'+str(numbinscatter)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'.txt', 'r')
  #   fnumdim = f.readline()
  #   fdimperimage = f.readline()
  #   fdim0 = f.readline()
  #   fdim1 = f.readline()
  #   fminvalue = f.readline()
  #   fmaxvalue = f.readline()
  #   f.close()

  #   buffer = StringIO.StringIO()
  #   img = Image.open(datapath+'/2_'+str(numbinscatter)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
  #   width = int(img.size[0])
  #   height = int(img.size[1])
  #   img.save(buffer, format='PNG')
  #   buffer.seek(0)

  #   data['index'] = index
  #   data['data'] = base64.b64encode(buffer.getvalue())
  #   data['numrelations'] = 2
  #   data['width'] = width
  #   data['height'] = height

  #   data['numentries'] = int(numentries)
  #   data['numdim'] = int(fnumdim)
  #   data['numbin'] = int(numbinscatter)
  #   data['dimperimage'] = int(dimperimage)
  #   data['dim0'] = i
  #   data['dim1'] = j
  #   data['minvalue'] = float(fminvalue)
  #   data['maxvalue'] = float(fmaxvalue)


  #   return json.dumps(data)

  # @cherrypy.expose
  # def getDataTile4D(self, firsttime, numbinscatter, dimperimage, i, j, k, l):

  #   cherrypy.response.headers['Content-Type'] = "application/json;"

  #   numbinscatter = int(numbinscatter)
  #   dimperimage = int(dimperimage)
  #   data = {}
  #   data['firsttime'] = firsttime

  #   f = open('./data4/info.txt', 'r')
  #   numdim = int(f.readline())
  #   dimperimage4 = int(f.readline())
  #   f.close()

  #   index = str(i)+' '+str(j)+' '+str(k)+' '+str(l)
  #   f = open('./data4/4_'+str(numbinscatter)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'_'+str(k)+'_'+str(l)+'.txt', 'r')
  #   fnumdim = f.readline()
  #   fdimperimage = f.readline()
  #   fdim0 = f.readline()
  #   fdim1 = f.readline()
  #   fdim2 = f.readline()
  #   fdim3 = f.readline()
  #   fminvalue = f.readline()
  #   fmaxvalue = f.readline()
  #   f.close()

  #   buffer = StringIO.StringIO()
  #   img = Image.open('./data4/4_'+str(numbinscatter)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'_'+str(k)+'_'+str(l)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
  #   width = int(img.size[0])
  #   height = int(img.size[1])
  #   img.save(buffer, format='PNG')
  #   buffer.seek(0)

  #   data['index'] = index
  #   data['data'] = base64.b64encode(buffer.getvalue())
  #   data['numrelations'] = 4
  #   data['width'] = width
  #   data['height'] = height

  #   data['numdim'] = int(fnumdim)
  #   data['numbin'] = int(numbinscatter)
  #   data['dimperimage'] = int(dimperimage)
  #   data['dim0'] = i
  #   data['dim1'] = j
  #   data['dim2'] = k
  #   data['dim3'] = l
  #   data['minvalue'] = float(fminvalue)
  #   data['maxvalue'] = float(fmaxvalue)


  #   return json.dumps(data)


  # @cherrypy.expose
  # def getDataTileHistogram(self, firsttime, numbinscatter, numbinhistogram, dimperimage, i, j):

  #   cherrypy.response.headers['Content-Type'] = "application/json;"

  #   numbinhistogram = int(numbinhistogram)
  #   dimperimagehist = int(dimperimage)
  #   data = {}
  #   data['firsttime'] = firsttime

  #   f = open('./data4/info.txt', 'r')
  #   numdim = int(f.readline())
  #   dimperimage4 = int(f.readline())
  #   f.close()

  #   index = str(i)+' '+str(j)
  #   f = open('./data4/hist_'+str(numbinscatter)+'_'+str(numbinhistogram)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'.txt', 'r')
  #   fnumdim = f.readline()
  #   fdimperimage = f.readline()
  #   fdim0 = f.readline()
  #   fdim1 = f.readline()
  #   fminvalue = f.readline()
  #   fmaxvalue = f.readline()
  #   f.close()

  #   buffer = StringIO.StringIO()
  #   img = Image.open('./data4/hist_'+str(numbinscatter)+'_'+str(numbinhistogram)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
  #   width = int(img.size[0])
  #   height = int(img.size[1])
  #   img.save(buffer, format='PNG')
  #   buffer.seek(0)

  #   data['index'] = index
  #   data['data'] = base64.b64encode(buffer.getvalue())
  #   data['width'] = width
  #   data['height'] = height
  #   data['numdim'] = int(fnumdim)
  #   data['dim0'] = i
  #   data['dim1'] = j
  #   data['numbin'] = int(numbinhistogram)
  #   data['minvalue'] = float(fminvalue)
  #   data['maxvalue'] = float(fmaxvalue)

  #   return json.dumps(data)


  # @cherrypy.expose
  # def dataold(self, firsttime, numbinscatter, numbinhistogram, dimperimage):

  #   cherrypy.response.headers['Content-Type'] = "application/json;"

  #   numbinscatter = int(numbinscatter)
  #   numbinhistogram = int(numbinhistogram)
  #   dimperimage = int(dimperimage)
  #   data = {}
  #   data['firsttime'] = firsttime
  #   numrelations = ['2', '4']

  #   loadedAllDim0 = False
  #   loadedAllDim1 = False
  #   #dim0 = 0
  #   #dim1 = 0
  #   numdim = 0

  #   #info file
  #   f = open('./data4/info.txt', 'r')
  #   numdim = int(f.readline())
  #   dimperimage2 = int(f.readline())
  #   dimperimage4 = int(f.readline())
  #   dimperimagehist = int(f.readline())
  #   f.close()

  #   data['numdim'] = numdim
  #   data['2'] = {}
  #   data['4'] = {}
  #   data['histogram'] = {}

  #   data['2']['dimperimage'] = dimperimage2
  #   data['4']['dimperimage'] = dimperimage4
  #   data['histogram']['dimperimage'] = dimperimagehist

  #   for i in range(0, numdim/dimperimage):
  #     for j in range(0, numdim/dimperimage):
        
  #       #2D
  #       index = str(i)+' '+str(j)
  #       f = open('./data4/2_'+str(numbinscatter)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'.txt', 'r')
  #       fnumdim = f.readline()
  #       fdimperimage = f.readline()
  #       fdim0 = f.readline()
  #       fdim1 = f.readline()
  #       fminvalue = f.readline()
  #       fmaxvalue = f.readline()
  #       f.close()

  #       buffer = StringIO.StringIO()
  #       img = Image.open('./data4/2_'+str(numbinscatter)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
  #       width = int(img.size[0])
  #       height = int(img.size[1])
  #       img.save(buffer, format='PNG')
  #       buffer.seek(0)

  #       data['2'][index] = {}
  #       data['2'][index]['data'] = base64.b64encode(buffer.getvalue())
  #       data['2'][index]['numrelations'] = '2'
  #       data['2'][index]['width'] = width
  #       data['2'][index]['height'] = height

  #       data['2'][index]['numdim'] = int(fnumdim)
  #       data['2'][index]['numbin'] = int(numbinscatter)
  #       data['2'][index]['dimperimage'] = int(dimperimage)
  #       data['2'][index]['dim0'] = i
  #       data['2'][index]['dim1'] = j
  #       data['2'][index]['minvalue'] = float(fminvalue)
  #       data['2'][index]['maxvalue'] = float(fmaxvalue)

  #       data['2']['dimperimage'] = int(dimperimage)



  #       #4D
  #       for k in range(0, numdim/dimperimage):
  #         for l in range(0, numdim/dimperimage):
  #           index = str(i)+' '+str(j)+' '+str(k)+' '+str(l)
  #           f = open('./data4/4_'+str(numbinscatter)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'_'+str(k)+'_'+str(l)+'.txt', 'r')
  #           fnumdim = f.readline()
  #           fdimperimage = f.readline()
  #           fdim0 = f.readline()
  #           fdim1 = f.readline()
  #           fdim2 = f.readline()
  #           fdim3 = f.readline()
  #           fminvalue = f.readline()
  #           fmaxvalue = f.readline()
  #           f.close()

  #           buffer = StringIO.StringIO()
  #           img = Image.open('./data4/4_'+str(numbinscatter)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'_'+str(k)+'_'+str(l)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
  #           width = int(img.size[0])
  #           height = int(img.size[1])
  #           img.save(buffer, format='PNG')
  #           buffer.seek(0)

  #           data['4'][index] = {}
  #           data['4'][index]['data'] = base64.b64encode(buffer.getvalue())
  #           data['4'][index]['numrelations'] = '4'
  #           data['4'][index]['width'] = width
  #           data['4'][index]['height'] = height

  #           data['4'][index]['numdim'] = int(fnumdim)
  #           data['4'][index]['numbin'] = int(numbinscatter)
  #           data['4'][index]['dimperimage'] = int(dimperimage)
  #           data['4'][index]['dim0'] = i
  #           data['4'][index]['dim1'] = j
  #           data['4'][index]['dim2'] = k
  #           data['4'][index]['dim3'] = l
  #           data['4'][index]['minvalue'] = float(fminvalue)
  #           data['4'][index]['maxvalue'] = float(fmaxvalue)

  #       data['4']['dimperimage'] = int(dimperimage)


  #       #histogram
  #       index = str(i)+' '+str(j)
  #       f = open('./data4/hist_'+str(numbinscatter)+'_'+str(numbinhistogram)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'.txt', 'r')
  #       fnumdim = f.readline()
  #       fdimperimage = f.readline()
  #       fdim0 = f.readline()
  #       fdim1 = f.readline()
  #       fminvalue = f.readline()
  #       fmaxvalue = f.readline()
  #       f.close()

  #       buffer = StringIO.StringIO()
  #       img = Image.open('./data4/hist_'+str(numbinscatter)+'_'+str(numbinhistogram)+'_'+str(dimperimage)+'_'+str(i)+'_'+str(j)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
  #       width = int(img.size[0])
  #       height = int(img.size[1])
  #       img.save(buffer, format='PNG')
  #       buffer.seek(0)

  #       data['histogram'][index] = {}
  #       data['histogram'][index]['data'] = base64.b64encode(buffer.getvalue())
  #       data['histogram'][index]['width'] = width
  #       data['histogram'][index]['height'] = height
  #       data['histogram'][index]['numdim'] = int(fnumdim)
  #       data['histogram'][index]['dim0'] = i
  #       data['histogram'][index]['dim1'] = j
  #       data['histogram'][index]['numbin'] = int(numbinhistogram)
  #       data['histogram'][index]['minvalue'] = float(fminvalue)
  #       data['histogram'][index]['maxvalue'] = float(fmaxvalue)

    
  #   return json.dumps(data)



  # index.expose = True

  # @cherrypy.expose
  # def dataoldold(self, i, j, dim1, dim2):

  #   cherrypy.response.headers['Content-Type'] = "application/json;"

  #   buffer = StringIO.StringIO()
  #   img = Image.open('./data/'+str(dim1)+'.'+str(dim2)+'.png') #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
  #   img.save(buffer, format='PNG')
  #   buffer.seek(0)

  #   data = {}
  #   data['data'] = base64.b64encode(buffer.getvalue())
  #   data['i'] = i
  #   data['j'] = j
  #   data['dim1'] = dim1
  #   data['dim2'] = dim2

  #   return json.dumps(data)


  index.expose = True

config = os.path.join(os.path.dirname(__file__), 'config.conf')

if __name__ == '__main__':
    # CherryPy always starts with app.root when trying to map request URIs
    # to objects, so we need to mount a request handler root. A request
    # to '/' will be mapped to HelloWorld().index().
    app = cherrypy.quickstart(ScatterPage(), config=config)
else:
    # This branch is for the test suite; you can ignore it.
    app = cherrypy.tree.mount(ScatterPage(), config=config)
