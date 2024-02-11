/**
 * Created by Andrewz on 8/5.
 */
this.TQ = this.TQ || {};

(function() {
  function ResourceDesc() {
  }

  function isReady(desc) {
    if (desc.data) { // image buffer
      return true;
    }

    return TQ.RM.hasResourceReady(desc.src);
  }

  ResourceDesc.isReady = isReady;
  TQ.ResourceDesc = ResourceDesc;
}());
