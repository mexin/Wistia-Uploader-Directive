angular.module('wistiaUpload')
    .directive('uploader', ['$timeout', '$sce', '$http', function ($timeout, $sce, $http) {
        return {
            restrict: 'E',
            templateUrl: 'app/templates/directive.wistiaUploader.html',
            replace: true,
            scope: {
                wistiaApiPass: "@wistiaPass"
            },
            link: function (scope, elem, attr) {
                scope.progress = 0;
                scope.status = 'idle';
                scope.isUploading = false;
                scope.isProcessing = false;
                scope.hashId = '';
                scope.url = '';
                
                //Activate hidden input
                elem.find('.upload-btn').click(function () {
                    elem.find('input[type="file"]').click();
                });

                scope.verifyStatus = function () {
                    $http({
                        method: 'GET',
                        url: 'https://api.wistia.com/v1/medias/' + scope.hashId + '.json?api_password=' + scope.wistiaApiPass
                    }).then(function (resp) {
                        scope.status = resp.data.status || '';

                        if (scope.status == 'ready') {
                            scope.progress = 0;
                            scope.isProcessing = false;
                            scope.url = $sce.trustAsResourceUrl('http://fast.wistia.net/embed/iframe/' + scope.hashId);
                        } else if (scope.status != 'failed') {
                            //check status again in a few seconds
                            $timeout(function () {
                                scope.verifyStatus();
                            }, 3000);
                        }
                    });
                };

                $timeout(function () {
                    $('#fileUpload').fileupload({
                        dataType: 'json',
                        formData: {
                            api_password: scope.wistiaApiPass
                        },
                        add: function (e, data) {
                            scope.hashId = '';
                            scope.progress = 0;
                            scope.status = 'uploading';
                            scope.isUploading = true;
                            scope.url = '';
                            scope.error = false;

                            var file = data.files[0];

                            if (file.type.indexOf('video') === -1) {
                                scope.error = true;
                                scope.status = 'File is not a video';
                                scope.$apply();
                                return;
                            }

                            data.submit();
                        },
                        done: function (e, data) {
                            if (data.result.hashed_id != '') {
                                scope.hashId = data.result.hashed_id;
                                scope.isUploading = false;
                                scope.isProcessing = true;
                                scope.verifyStatus();
                            }
                        },
                        progressall: function (e, data) {
                            scope.progress = parseInt(data.loaded / data.total * 100, 10);
                            scope.$apply();

                        }
                    });
                });
            }
        }
    }]);