import cherrypy
import simplejson
import os
import random
import StringIO
import cairo

import datatile


HTML_DIR = os.path.join(os.path.abspath("."), u"html")
class ScatterPage:
  @cherrypy.expose
  def index(self):
    return open(os.path.join(HTML_DIR, u'index.html')) 

  @cherrypy.expose
  def data(self, binsize, width, height, numentries, numdim):

    binsize = int(binsize)
    width = int(width)
    height = int(height)
    numentries = int(numentries)
    numdim = int(numdim)

    datatile.generateData(numentries, numdim)
    datatile.generateDataTiles(binsize, width, height)
    tile = datatile.getTile(5, 5)

    cherrypy.response.headers['Content-Type'] = "image/png"
    buffer = StringIO.StringIO()
    tile.write_to_png(buffer)
    tile.write_to_png("t1.png")
    buffer.seek(0)
    return cherrypy.lib.file_generator(buffer)


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
